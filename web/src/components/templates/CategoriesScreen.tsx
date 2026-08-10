"use client";

import { motion } from "motion/react";

import { CategoryCard } from "@/components/molecules/CategoryCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import categoriesHooks from "@/hooks/useCategories";
import { SETTINGS_STAGGER_CONTAINER } from "@/utils/settingsStagger";

export function CategoriesScreen() {
  const { list } = categoriesHooks.use();
  const categories = list.data;
  const isEmpty = categories.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Spending by category this month.
        </p>
      </section>

      {isEmpty && (
        <EmptyState
          title="No categories yet"
          description="Ask Moneta to add a category or start logging expenses to see them here."
        />
      )}

      {!isEmpty && (
        <motion.section
          variants={SETTINGS_STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          aria-label="Categories list"
          className="grid gap-3 sm:grid-cols-2"
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </motion.section>
      )}
    </main>
  );
}

export default CategoriesScreen;
