import { Badge } from '@/components/ui/badge';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">Active</Badge>;
    case 'paused':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300">Paused</Badge>;
    case 'ended':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300">Ended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default getStatusBadge;
