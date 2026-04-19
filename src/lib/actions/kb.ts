"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// --- CLIENT ACTIONS ---

export async function getPublicArticles(orgSlug: string, categoryId?: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true }
  });

  if (!org) return [];

  return prisma.article.findMany({
    where: {
      organizationId: org.id,
      isPublished: true,
      audience: "PUBLIC",
      ...(categoryId ? { categoryId } : {})
    },
    include: {
      category: true,
      author: { select: { name: true, avatar: true } }
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getPublicCategories(orgSlug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true }
  });

  if (!org) return [];

  return prisma.articleCategory.findMany({
    where: { organizationId: org.id },
    include: {
      _count: {
        select: { articles: { where: { isPublished: true, audience: "PUBLIC" } } }
      }
    },
    orderBy: { order: "asc" }
  });
}

export async function searchPublicArticles(orgSlug: string, query: string) {
  if (!query || query.length < 3) return [];

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true }
  });

  if (!org) return [];

  return prisma.article.findMany({
    where: {
      organizationId: org.id,
      isPublished: true,
      audience: "PUBLIC",
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { keywords: { contains: query } }
      ]
    },
    take: 5
  });
}

export async function getArticle(slug: string, orgSlug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true }
  });

  if (!org) return null;

  const article = await prisma.article.findFirst({
    where: {
      slug,
      organizationId: org.id,
      isPublished: true,
      audience: "PUBLIC"
    },
    include: {
      category: true,
      author: { select: { name: true, image: true, avatar: true } }
    }
  });

  if (article) {
    await prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } }
    });
  }

  return article;
}

export async function voteArticleHelpful(articleId: string) {
  return prisma.article.update({
    where: { id: articleId },
    data: { helpfulCount: { increment: 1 } }
  });
}

// --- ADMIN ACTIONS ---

export async function getAdminArticles() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) return [];

  return prisma.article.findMany({
    where: { organizationId: orgId },
    include: {
      category: true,
      author: { select: { name: true } }
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getAdminArticleById(id: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) return null;

  return prisma.article.findUnique({
    where: { id, organizationId: orgId },
    include: {
      category: true
    }
  });
}

export async function createArticle(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  keywords?: string;
  categoryId?: string;
  isPublished?: boolean;
  audience?: string;
}) {
  const session = await auth();
  const user = session?.user as any;
  const orgId = user?.organizationId;

  if (!orgId) throw new Error("Unauthorized");

  // Ensure categoryId is null if empty string
  const categoryId = data.categoryId === "" ? null : data.categoryId;

  const article = await prisma.article.create({
    data: {
      ...data,
      categoryId,
      organizationId: orgId,
      authorId: user.id,
      status: data.isPublished ? "PUBLISHED" : "DRAFT",
      publishedAt: data.isPublished ? new Date() : null,
    }
  });

  revalidatePath("/kb");
  revalidatePath("/client/kb");
  return article;
}

export async function updateArticle(id: string, data: any) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) throw new Error("Unauthorized");

  // Ensure categoryId is null if empty string
  const categoryId = data.categoryId === "" ? null : data.categoryId;

  const article = await prisma.article.update({
    where: { id, organizationId: orgId },
    data: {
      ...data,
      categoryId,
      status: data.isPublished ? "PUBLISHED" : "DRAFT",
      publishedAt: data.isPublished ? new Date() : null,
    }
  });

  revalidatePath("/kb");
  revalidatePath(`/kb/${id}`);
  revalidatePath("/client/kb");
  return article;
}

export async function deleteArticle(id: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) throw new Error("Unauthorized");

  await prisma.article.delete({
    where: { id, organizationId: orgId }
  });

  revalidatePath("/kb");
  revalidatePath("/client/kb");
}

export async function getAdminCategories() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) return [];

  const categories = await prisma.articleCategory.findMany({
    where: { organizationId: orgId },
    orderBy: { order: "asc" }
  });

  // Seed default categories if none exist
  if (categories.length === 0) {
    const defaults = [
      { name: "Getting Started", slug: "getting-started", order: 0 },
      { name: "Account & Billing", slug: "account-billing", order: 1 },
      { name: "Troubleshooting", slug: "troubleshooting", order: 2 },
      { name: "Product Updates", slug: "product-updates", order: 3 },
    ];

    await Promise.all(
      defaults.map(cat => 
        prisma.articleCategory.create({
          data: {
            ...cat,
            organizationId: orgId,
          }
        })
      )
    );

    return prisma.articleCategory.findMany({
      where: { organizationId: orgId },
      orderBy: { order: "asc" }
    });
  }

  return categories;
}
