import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth();

    const orgId = (session?.user as any)?.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, priority, status } = body;

    const ticket = await prisma.ticket.update({
      where: {
        id: id,
        organizationId: orgId,
      },
      data: {
        subject,
        description,
        priority,
        status,
      },
    });

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${id}`);

    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
