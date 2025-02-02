export function getArrayFromDefined(arr = [], ...items: any[]) {
    return items.reduce((p: [], item: any) => (item ? [ ...p, item ] : p), arr)
}