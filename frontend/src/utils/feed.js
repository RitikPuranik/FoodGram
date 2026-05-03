function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getStableShuffledItems(items = [], seed = 'feed') {
  return [...items]
    .map((item, index) => ({
      item,
      sortKey: hashString(`${seed}:${item?._id || item?.id || index}`),
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item);
}

export function interleaveFoodItemsByVendor(items = [], { seed = 'feed-vendors', shuffleGroups = false } = {}) {
  const groupedItems = new Map();

  items.forEach((item, index) => {
    const vendorId = item?.foodPartner?._id || item?.foodPartner || `ungrouped-${item?._id || index}`;

    if (!groupedItems.has(vendorId)) {
      groupedItems.set(vendorId, []);
    }

    groupedItems.get(vendorId).push(item);
  });

  const vendorBuckets = [...groupedItems.entries()].map(([vendorId, vendorItems], index) => {
    const orderedItems = [...vendorItems].sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());

    return {
      vendorId,
      items: orderedItems,
      latestTimestamp: new Date(orderedItems[0]?.createdAt || 0).getTime(),
      shuffleKey: hashString(`${seed}:${vendorId}:${index}`),
    };
  });

  vendorBuckets.sort((a, b) => {
    if (shuffleGroups) {
      return a.shuffleKey - b.shuffleKey;
    }

    return b.latestTimestamp - a.latestTimestamp;
  });

  const arrangedItems = [];
  let hasItemsRemaining = true;

  while (hasItemsRemaining) {
    hasItemsRemaining = false;

    vendorBuckets.forEach((bucket) => {
      if (bucket.items.length > 0) {
        arrangedItems.push(bucket.items.shift());
        hasItemsRemaining = true;
      }
    });
  }

  return arrangedItems;
}
