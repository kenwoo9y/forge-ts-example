import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { TodoDetail } from '@/features/todos/components/todo-detail';

export default function TodoDetailScreen() {
  const { publicId } = useLocalSearchParams<{ publicId: string }>();

  return (
    <View className="flex-1">
      <TodoDetail publicId={publicId} onEditPress={() => {}} />
    </View>
  );
}
