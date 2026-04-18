"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

/**
 * Deletes all demo organizations that have expired including their cooldown.
 */
export async function cleanupExpiredDemos() {
  const now = new Date();
  const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

  const expiredOrgs = await prisma.organization.findMany({
    where: {
      isDemo: true,
      createdAt: {
        lt: twentyMinutesAgo
      }
    },
    select: { id: true }
  });

  if (expiredOrgs.length > 0) {
    console.log(`[DEMO] Cleaning up ${expiredOrgs.length} fully expired demo organizations`);
    await prisma.organization.deleteMany({
      where: {
        id: {
          in: expiredOrgs.map(org => org.id)
        }
      }
    });
  }
}

/**
 * Sets up a fresh demo environment and returns the credentials.
 * Implements a 15-minute runtime + 5-minute cooldown.
 */
export async function setupDemo() {
  await cleanupExpiredDemos();

  // Check for any currently active or cooling-down demo
  const currentDemo = await prisma.organization.findFirst({
    where: { isDemo: true },
    orderBy: { createdAt: 'desc' },
    include: { users: true }
  });

  if (currentDemo) {
    const now = Date.now();
    const createdAt = currentDemo.createdAt.getTime();
    const elapsed = now - createdAt;
    const activeLimit = 15 * 60 * 1000;
    const totalLimit = 20 * 60 * 1000;

    if (elapsed < activeLimit) {
      // Demo is still active. 
      // Instead of failing, we return the existing credentials so they can join the session.
      const user = currentDemo.users[0];
      return { 
        email: user.email, 
        password: "demo123", 
        remaining: Math.ceil((activeLimit - elapsed) / 1000 / 60) 
      };
    } else if (elapsed < totalLimit) {
      // Demo is in COOLDOWN
      const cooldownRemaining = Math.ceil((totalLimit - elapsed) / 1000 / 60);
      throw new Error(`COOLDOWN:${cooldownRemaining}`);
    }
  }

  // If we're here, either no demo exists or the last one was > 20 mins ago.
  // We'll delete any stuck record before creating a fresh one.
  await prisma.organization.deleteMany({ where: { isDemo: true } });

  const demoEmail = `demo-${uuidv4().slice(0, 8)}@getclearq.com`;
  const demoPassword = "demo123";
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const org = await prisma.organization.create({
    data: {
      name: "Shared Support Demo",
      slug: "demo-instance",
      isDemo: true,
      expiresAt,
      plan: "ENTERPRISE",
      subscriptionStatus: "ACTIVE",
      users: {
        create: {
          email: demoEmail,
          name: "Demo Agent",
          passwordHash,
          role: "ADMIN",
          isActive: true,
          plan: "ENTERPRISE",
          subscriptionStatus: "ACTIVE",
        }
      }
    },
    include: {
      users: true
    }
  });

  const user = org.users[0];
  const team = await prisma.team.create({
    data: { name: "Global Support", organizationId: org.id }
  });

  await prisma.teamMember.create({
    data: { userId: user.id, teamId: team.id, role: "admin" }
  });

  await prisma.ticket.createMany({
    data: [
      {
        number: Math.floor(1000 + Math.random() * 9000),
        subject: "Welcome to your ClearQ Demo!",
        description: "This is a shared session. You have 15 minutes as a group to explore features before a 5-minute reset.",
        status: "OPEN",
        priority: "HIGH",
        creatorId: user.id,
        organizationId: org.id,
        teamId: team.id,
      }
    ]
  });

  return { email: demoEmail, password: demoPassword, remaining: 15 };
}

