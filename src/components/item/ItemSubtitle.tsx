import React from 'react';
import type { GeoDocument } from '../../types/api';

interface ItemSubtitleProps {
  item: GeoDocument;
}

export function ItemSubtitle({ item }: ItemSubtitleProps) {
  // Get publisher or creator
  const mainCredit = item.dc_publisher_sm?.length
    ? item.dc_publisher_sm.join(', ')
    : item.dct_creator_sm?.length
      ? item.dct_creator_sm.join(', ')
      : null;

  // Get year
  const year = item.dct_temporal_sm?.length
    ? item.dct_temporal_sm.join(', ')
    : null;

  if (!mainCredit && !year) return null;

  return (
    <h3 className="text-lg text-gray-600 italic">
      {mainCredit}
      {mainCredit && year && <span className="mx-2">&middot;</span>}
      {year}
    </h3>
  );
}
