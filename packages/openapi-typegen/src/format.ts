export const formatTitle = (title: string) => {
  return title.replace(/ /g, '').replace(/[^a-zA-Z0-9]/g, '_')
}
