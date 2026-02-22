import { AppLayout } from "@/components/layouts/app-layout";
import { TodoList } from "@/features/todos/components/todo-list";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "default";

export default function TodosPage() {
  return (
    <AppLayout>
      <TodoList username={DEFAULT_USERNAME} />
    </AppLayout>
  );
}
