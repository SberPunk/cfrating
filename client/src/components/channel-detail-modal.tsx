import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Star, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Glassmorphism } from "@/components/ui/glassmorphism";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChannelWithTags, Review } from "@shared/schema";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  isAnonymous: z.boolean().default(true),
  authorName: z.string().optional(),
}).refine((data) => {
  if (!data.isAnonymous && !data.authorName?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Имя автора обязательно для неанонимных отзывов",
  path: ["authorName"],
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ChannelDetailModalProps {
  channel: ChannelWithTags | null;
  onClose: () => void;
}

export function ChannelDetailModal({ channel, onClose }: ChannelDetailModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      isAnonymous: true,
      authorName: "",
    },
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/channels", channel?.id, "reviews"],
    enabled: !!channel,
  });

  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      await apiRequest("POST", `/api/channels/${channel?.id}/reviews`, data);
    },
    onSuccess: () => {
      toast({
        title: "Отзыв добавлен",
        description: "Отзыв будет проверен модератором перед публикацией",
      });
      form.reset();
      setShowReviewForm(false);
      queryClient.invalidateQueries({ 
        queryKey: ["/api/channels", channel?.id, "reviews"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить отзыв",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    addReviewMutation.mutate({ ...data, rating: selectedRating });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "сегодня";
    if (diffDays === 2) return "вчера";
    if (diffDays <= 7) return `${diffDays} дней назад`;
    return date.toLocaleDateString();
  };

  if (!channel) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <Glassmorphism className="w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{channel.name}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Channel Info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[hsl(205,100%,40%)] rounded-full flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">
                      {channel.averageRating ? Number(channel.averageRating).toFixed(1) : "0.0"}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{channel.subscriberCount || 0} подписчиков</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {channel.description || "Описание не указано"}
                </p>
              </div>
            </div>

            {/* Tags */}
            {channel.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Теги</h3>
                <div className="flex flex-wrap gap-2">
                  {channel.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                className="flex-1 telegram-button text-white font-medium"
                onClick={() => window.open(channel.url, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Открыть
              </Button>
              <Button
                variant="outline"
                className="flex-1 glass-button"
                onClick={() => setShowReviewForm(true)}
              >
                <Star className="w-4 h-4 mr-2" />
                Отзыв
              </Button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <Glassmorphism className="p-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Оценка
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setSelectedRating(rating)}
                            className={`w-8 h-8 ${
                              rating <= selectedRating
                                ? "text-yellow-400"
                                : "text-gray-400"
                            }`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-300">
                            Комментарий
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ваш отзыв о канале..."
                              rows={3}
                              {...field}
                              className="glass-button resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isAnonymous"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium text-gray-300">
                              Анонимный отзыв
                            </FormLabel>
                            <div className="text-xs text-gray-400">
                              Скрыть имя автора отзыва
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {!form.watch("isAnonymous") && (
                      <FormField
                        control={form.control}
                        name="authorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-300">
                              Имя автора
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Введите ваше имя..."
                                {...field}
                                className="glass-button"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        className="flex-1 telegram-button text-white"
                        disabled={addReviewMutation.isPending}
                      >
                        {addReviewMutation.isPending ? "Отправляем..." : "Отправить"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 glass-button"
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                </Form>
              </Glassmorphism>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Отзывы</h3>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <Glassmorphism key={review.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {review.isAnonymous ? "Аноним" : review.authorName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-400">{review.rating}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-300">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(review.createdAt)}
                      </p>
                    </Glassmorphism>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Glassmorphism>
    </div>
  );
}
