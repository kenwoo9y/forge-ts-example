import { AppLayout } from "@/components/layouts/app-layout";
import { TodoDetail } from "@/features/todos/components/todo-detail";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "default";

type TodoDetailPageProps = {
  params: Promise<{ publicId: string }>;
};

export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { publicId } = await params;

  return (
    <AppLayout>
      <TodoDetail publicId={publicId} username={DEFAULT_USERNAME} />
    </AppLayout>
  );
}
