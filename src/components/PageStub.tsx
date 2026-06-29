// Placeholder for routes not yet built out. Each menu item already has its own
// page/route from M1; the content is filled in during later milestones.
export default function PageStub({ title, note }: { title: string; note?: string }) {
  return (
    <div className="page-stub fadein">
      <h1>{title}</h1>
      <p>{note ?? 'Coming together in a later milestone.'}</p>
    </div>
  );
}
