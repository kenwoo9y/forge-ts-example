import type { IUserQueryService } from '../../user/query/queryService.js';
import type { CreateTaskOutput } from '../dto.js';
import type { ICreateTaskUseCase } from './createTaskUseCase.js';

/**
 * ユーザー名でタスクを作成するユースケースの入力データ型。
 */
export type CreateTaskByUsernameInput = {
  /** タスクのタイトル。未指定の場合は `null` */
  title: string | null;
  /** タスクの説明。未指定の場合は `null` */
  description: string | null;
  /** 期日。未指定の場合は `null` */
  dueDate: Date | null;
  /** ステータス文字列（'todo' | 'doing' | 'done'）。未指定の場合は `null` */
  status: string | null;
};

/**
 * ユーザー名でタスクを作成するユースケースのインターフェース。
 */
export interface ICreateTaskByUsernameUseCase {
  /**
   * ユーザー名に紐づくタスクを作成する。
   * @param username タスクの所有者のユーザー名
   * @param input タスク作成に必要な入力データ
   * @returns 作成されたタスクの出力データ。ユーザーが存在しない場合は `null`
   */
  execute(username: string, input: CreateTaskByUsernameInput): Promise<CreateTaskOutput | null>;
}

/**
 * ユーザー名でタスクを作成するユースケースの実装クラス。
 * ユーザー名から `ownerId` を解決してタスクを作成する。
 */
export class CreateTaskByUsernameUseCase implements ICreateTaskByUsernameUseCase {
  /**
   * @param createTaskUseCase タスク作成ユースケース
   * @param userQueryService ユーザークエリサービス
   */
  constructor(
    private readonly createTaskUseCase: ICreateTaskUseCase,
    private readonly userQueryService: IUserQueryService
  ) {}

  /**
   * ユーザー名に紐づくタスクを作成する。
   * @param username タスクの所有者のユーザー名
   * @param input タスク作成に必要な入力データ
   * @returns 作成されたタスクの出力データ。ユーザーが存在しない場合は `null`
   */
  async execute(
    username: string,
    input: CreateTaskByUsernameInput
  ): Promise<CreateTaskOutput | null> {
    const user = await this.userQueryService.findByUsername(username);
    if (!user) {
      return null;
    }
    return this.createTaskUseCase.execute({
      ...input,
      ownerId: user.id,
    });
  }
}
