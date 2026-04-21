'use server';

import prisma from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function getBranches(companyId: string) {
  try {
    const branches = await prisma.branch.findMany({
      where: { companyId },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: branches };
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { success: false, error: "Failed to fetch branches" };
  }
}

export async function createBranch(companyId: string, data: {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  password?: string;
}) {
  try {
    const { password, email, ...branchData } = data;

    if (!email) {
      return { success: false, error: "Email is required for branch login" };
    }

    if (!password) {
      return { success: false, error: "Password is required for branch login" };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    const hashedPassword = await hash(password, 12);

    // Fetch parent company name for context
    const parentCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true }
    });

    // Create User and Branch in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: data.contactPerson || `${parentCompany?.name || 'Company'} - ${data.name}`,
          role: 'USER',
          isCompleted: true,
        }
      });

      const branch = await tx.branch.create({
        data: {
          ...branchData,
          email,
          companyId,
          userId: user.id,
        },
        include: { user: { select: { email: true } } }
      });

      return branch;
    });

    revalidatePath('/dashboard/branches');
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating branch:", error);
    return { success: false, error: "Failed to create branch" };
  }
}

export async function updateBranch(id: string, data: {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  password?: string;
}) {
  try {
    const { password, email, ...branchData } = data;

    const existingBranch = await prisma.branch.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingBranch) {
      return { success: false, error: "Branch not found" };
    }

    // If email changed, check for duplicates (excluding own user)
    if (email && existingBranch.user && email !== existingBranch.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== existingBranch.userId) {
        return { success: false, error: "A user with this email already exists" };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update the linked user if exists
      if (existingBranch.userId) {
        const userUpdate: any = {};
        if (email) userUpdate.email = email;
        if (password) userUpdate.password = await hash(password, 12);
        if (data.contactPerson) userUpdate.name = data.contactPerson;

        if (Object.keys(userUpdate).length > 0) {
          await tx.user.update({
            where: { id: existingBranch.userId },
            data: userUpdate,
          });
        }
      }

      const branch = await tx.branch.update({
        where: { id },
        data: { ...branchData, email },
        include: { user: { select: { email: true } } }
      });

      return branch;
    });

    revalidatePath('/dashboard/branches');
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating branch:", error);
    return { success: false, error: "Failed to update branch" };
  }
}

export async function deleteBranch(id: string) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id } });

    await prisma.$transaction(async (tx) => {
      // Delete branch first (to remove FK on userId)
      await tx.branch.delete({ where: { id } });

      // Then delete the linked user if exists
      if (branch?.userId) {
        await tx.user.delete({ where: { id: branch.userId } });
      }
    });

    revalidatePath('/dashboard/branches');
    return { success: true };
  } catch (error) {
    console.error("Error deleting branch:", error);
    return { success: false, error: "Failed to delete branch" };
  }
}
