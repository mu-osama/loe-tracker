export async function GET(
  request: Request,
  { params }: { params: { slug?: string[] } },
) {
  const parts = params.slug?.filter(Boolean) ?? [];
  const target = new URL(`/docs/${parts.join('/')}`, request.url);
  return Response.redirect(target, 308);
}
