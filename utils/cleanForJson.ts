export function cleanForJSON(input: any): any {
    return JSON.parse(JSON.stringify(input));
}