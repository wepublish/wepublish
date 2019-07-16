export function findEntryFromAssetList(
  entryName: string,
  assetList: {[entry: string]: string[]}
): string | undefined {
  return assetList[entryName].filter(file => file.endsWith('.js'))[0]
}
