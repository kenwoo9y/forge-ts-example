import type { TaskStatus } from './value/taskStatus.js';

/**
 * タスクエンティティ。
 * タスク管理システムにおけるタスクを表すドメインオブジェクト。
 */
export class Task {
  /**
   * @param id 内部的な自動採番ID
   * @param publicId 外部公開用のUUID
   * @param title タスクのタイトル。未設定の場合は `null`
   * @param description タスクの説明。未設定の場合は `null`
   * @param dueDate 期日。未設定の場合は `null`
   * @param status タスクのステータス（値オブジェクト）。未設定の場合は `null`
   * @param ownerId タスクを所有するユーザーのID。未設定の場合は `null`
   * @param createdAt 作成日時
   * @param updatedAt 更新日時
   */
  constructor(
    public readonly id: bigint,
    public readonly publicId: string,
    public readonly title: string | null,
    public readonly description: string | null,
    public readonly dueDate: Date | null,
    public readonly status: TaskStatus | null,
    public readonly ownerId: bigint | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
