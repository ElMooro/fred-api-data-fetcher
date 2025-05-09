import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as itemsApi from '../api/itemsApi';

// Query keys for caching and invalidation
const ITEMS_KEYS = {
  all: ['items'],
  lists: () => [...ITEMS_KEYS.all, 'list'],
  list: (filters) => [...ITEMS_KEYS.lists(), { ...filters }],
  details: () => [...ITEMS_KEYS.all, 'detail'],
  detail: (id) => [...ITEMS_KEYS.details(), id],
};

export const useGetItems = (filters = {}) => {
  return useQuery({
    queryKey: ITEMS_KEYS.list(filters),
    queryFn: () => itemsApi.getItems(filters),
    keepPreviousData: true,
    onError: (error) => {
      toast.error(`Failed to fetch items: ${error.message}`);
    },
  });
};

export const useGetItemById = (id) => {
  return useQuery({
    queryKey: ITEMS_KEYS.detail(id),
    queryFn: () => itemsApi.getItemById(id),
    enabled: !!id,
    onError: (error) => {
      toast.error(`Failed to fetch item: ${error.message}`);
    },
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => itemsApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(ITEMS_KEYS.lists());
      toast.success('Item created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create item: ${error.message}`);
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => itemsApi.updateItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(ITEMS_KEYS.lists());
      queryClient.invalidateQueries(ITEMS_KEYS.detail(variables.id));
      toast.success('Item updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => itemsApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries(ITEMS_KEYS.lists());
      toast.success('Item deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
};
