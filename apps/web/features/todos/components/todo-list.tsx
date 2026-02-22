"use client";

import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTodos } from "../api/get-todos";
import type { Todo } from "../types";
import { formatDate } from "../utils";
import { CreateTodoDialog } from "./create-todo-dialog";
import { DeleteTodoDialog } from "./delete-todo-dialog";
import { EditTodoDialog } from "./edit-todo-dialog";
import { StatusBadge } from "./status-badge";

type TodoTableProps = {
  todos: Todo[];
  onEditClick: (todo: Todo) => void;
  onDeleteClick: (todo: Todo) => void;
};

function TodoTable({ todos, onEditClick, onDeleteClick }: TodoTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-white hover:bg-white">
            <TableHead className="w-12 text-gray-500">#</TableHead>
            <TableHead className="text-gray-500">
              <span className="inline-flex items-center gap-1">
                タイトル
                <ArrowUpDown className="h-3.5 w-3.5" />
              </span>
            </TableHead>
            <TableHead className="w-44 text-gray-500">
              <span className="inline-flex items-center gap-1">
                期日
                <ArrowUpDown className="h-3.5 w-3.5" />
              </span>
            </TableHead>
            <TableHead className="w-36 text-gray-500">
              <span className="inline-flex items-center gap-1">
                ステータス
                <ArrowUpDown className="h-3.5 w-3.5" />
              </span>
            </TableHead>
            <TableHead className="w-28 text-gray-500">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todos.map((todo, index) => (
            <TableRow
              key={todo.publicId}
              className="border-b border-gray-100 cursor-pointer"
              onClick={() => router.push(`/todos/${todo.publicId}`)}
            >
              <TableCell className="text-gray-400">{index + 1}</TableCell>
              <TableCell>{todo.title ?? "-"}</TableCell>
              <TableCell className="text-gray-600">
                {formatDate(todo.dueDate)}
              </TableCell>
              <TableCell>
                <StatusBadge status={todo.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="編集"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(todo);
                    }}
                    className="text-orange-400 hover:text-orange-500 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="削除"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(todo);
                    }}
                    className="text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type TodoListProps = {
  username: string;
};

export function TodoList({ username }: TodoListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  const { data: todos, isLoading, isError } = useTodos(username);

  return (
    <div className="mx-auto max-w-5xl px-6 py-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ToDoリスト</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          新規追加
        </Button>
      </div>

      {isCreateOpen && (
        <CreateTodoDialog
          username={username}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          username={username}
          onClose={() => setEditingTodo(null)}
        />
      )}

      {deletingTodo && (
        <DeleteTodoDialog
          todo={deletingTodo}
          username={username}
          onClose={() => setDeletingTodo(null)}
        />
      )}

      {isLoading && (
        <div className="py-20 text-center text-gray-400">読み込み中...</div>
      )}

      {isError && (
        <div className="py-20 text-center text-gray-400">
          データの取得に失敗しました
        </div>
      )}

      {todos && todos.length === 0 && (
        <div className="py-20 text-center text-gray-400">ToDoがありません</div>
      )}

      {todos && todos.length > 0 && (
        <TodoTable
          todos={todos}
          onEditClick={setEditingTodo}
          onDeleteClick={setDeletingTodo}
        />
      )}
    </div>
  );
}
