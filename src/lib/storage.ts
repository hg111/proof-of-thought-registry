export async function putArtifact(parentId: string, artifactId: string, name: string, buf: Buffer) {
  const key = `artifacts/${parentId}/${artifactId}/${name}`;
  await putObject(key, buf, "application/octet-stream");
  return key;
}