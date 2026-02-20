const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const deepClone = (value) => {
    if (Array.isArray(value)) {
        return value.map(deepClone);
    }

    if (isPlainObject(value)) {
        return Object.keys(value).reduce((result, key) => {
            result[key] = deepClone(value[key]);
            return result;
        }, {});
    }

    return value;
};

const formatTimestamp = (value) => {
    const match = /^t:(\d+)$/.exec(value);

    if (!match) {
        return value;
    }

    const date = new Date(Number(match[1]));
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
};

const transformValue = (value) => {
    if (typeof value === 'string') {
        return formatTimestamp(value);
    }

    if (Array.isArray(value) || isPlainObject(value)) {
        return deserialize(value);
    }

    return value;
};

export const add = (...values) => values.reduce((sum, value) => sum + value, 0);

export const listToObject = (list) => list.reduce((result, item) => {
    result[item.name] = deepClone(item.value);
    return result;
}, {});

export const objectToList = (obj) => Object.keys(obj).map((key) => ({
    name: key,
    value: deepClone(obj[key]),
}));

export const deserialize = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(transformValue);
    }

    if (!isPlainObject(obj)) {
        return obj;
    }

    const groups = new Map();
    const result = {};

    Object.keys(obj).forEach((key) => {
        const match = /^(.+?)(\d+)_(.+)$/.exec(key);

        if (!match) {
            result[key] = transformValue(obj[key]);
            return;
        }

        const [, listName, indexStr, propName] = match;
        const index = Number(indexStr);

        if (!groups.has(listName)) {
            groups.set(listName, new Map());
        }

        const listItems = groups.get(listName);

        if (!listItems.has(index)) {
            listItems.set(index, {});
        }

        listItems.get(index)[propName] = transformValue(obj[key]);
    });

    groups.forEach((items, listName) => {
        const sorted = [...items.entries()]
            .sort(([left], [right]) => left - right)
            .map(([, value]) => value);

        result[listName] = sorted;
    });

    return result;
};
