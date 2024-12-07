import React from 'react';

interface ItemDescriptionProps {
  description: string[];
}

export function ItemDescription({ description }: ItemDescriptionProps) {
  if (!description || description.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
      {description.map((desc, index) => (
        <p key={index} className="text-gray-600 mb-2">{desc}</p>
      ))}
    </section>
  );
}