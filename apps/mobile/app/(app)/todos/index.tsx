import { View } from 'react-native';
import { TodoList } from '@/features/todos/components/todo-list';

export default function TodosScreen() {
  return (
    <View className="flex-1">
      <TodoList onCreatePress={() => {}} />
    </View>
  );
}
