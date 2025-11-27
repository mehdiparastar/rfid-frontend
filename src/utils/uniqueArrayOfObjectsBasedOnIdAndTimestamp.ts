export const uniqueByIdAndTimeStamp = (arr: ({ id: number | string, timestamp: number } & any)[]) => Object.values(
    arr.reduce((acc, item) => {
        const existing = acc[item.id];
        if (!existing || item.timestamp > existing.timestamp) {
            acc[item.id] = item;
        }
        return acc;
    }, {})
);