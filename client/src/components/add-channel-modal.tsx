import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Glassmorphism } from "@/components/ui/glassmorphism";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tag } from "@shared/schema";

const addChannelSchema = z.object({
  name: z.string().min(1, "Название канала обязательно"),
  url: z.string().url("Введите корректную ссылку"),
  description: z.string().optional(),
});

type AddChannelFormData = z.infer<typeof addChannelSchema>;

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddChannelModal({ isOpen, onClose }: AddChannelModalProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddChannelFormData>({
    resolver: zodResolver(addChannelSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
    },
  });

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
    enabled: isOpen,
  });

  // Filter to only show approved tags
  const tags = allTags.filter((tag: Tag) => tag.isApproved);

  const addChannelMutation = useMutation({
    mutationFn: async (data: AddChannelFormData & { tagIds: number[] }) => {
      await apiRequest("POST", "/api/channels", data);
    },
    onSuccess: () => {
      toast({
        title: "Канал добавлен",
        description: "Канал будет проверен модератором перед публикацией",
      });
      form.reset();
      setSelectedTags([]);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить канал",
        variant: "destructive",
      });
    },
  });

  const handleTagToggle = (tag: Tag) => {
    setSelectedTags((prev) => {
      const isSelected = prev.find((selected) => selected.id === tag.id);
      if (isSelected) {
        return prev.filter((selected) => selected.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const onSubmit = (data: AddChannelFormData) => {
    addChannelMutation.mutate({
      ...data,
      tagIds: selectedTags.map((tag) => tag.id),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <Glassmorphism className="w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Добавить канал</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-300">
                      Название канала
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Название канала"
                        {...field}
                        className="glass-button"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-300">
                      Ссылка на канал
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://t.me/channel_name"
                        {...field}
                        className="glass-button"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-300">
                      Описание
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Краткое описание канала..."
                        rows={3}
                        {...field}
                        className="glass-button resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Теги (выберите подходящие)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.find((selected) => selected.id === tag.id);
                      return (
                        <Button
                          key={tag.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTagToggle(tag)}
                          className={`glass-button text-xs transition-colors ${
                            isSelected 
                              ? 'bg-[hsl(205,100%,40%)] border-[hsl(205,100%,40%)] text-white' 
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {tag.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full telegram-button text-white font-medium"
                  disabled={addChannelMutation.isPending}
                >
                  {addChannelMutation.isPending ? "Добавляем..." : "Добавить канал"}
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  Канал будет проверен модератором перед публикацией
                </p>
              </div>
            </form>
          </Form>
        </div>
      </Glassmorphism>
    </div>
  );
}
