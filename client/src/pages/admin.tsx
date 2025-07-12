import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Shield, 
  Home, 
  Radio, 
  Star, 
  Tags, 
  LogOut, 
  Clock, 
  CheckCircle,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Users,
  Eye,
  Ban,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Channel, Review, TagSuggestion } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя обязательно"),
  password: z.string().min(1, "Пароль обязателен"),
});

const tagSchema = z.object({
  name: z.string().min(1, "Название тега обязательно"),
  color: z.string().min(1, "Цвет тега обязателен"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TagFormData = z.infer<typeof tagSchema>;

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: adminCheckLoading } = useQuery({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin?.isAdmin,
  });

  const { data: adminChannels } = useQuery({
    queryKey: ["/api/admin/channels"],
    enabled: isAdmin?.isAdmin,
  });

  const { data: adminReviews } = useQuery({
    queryKey: ["/api/admin/reviews"],
    enabled: isAdmin?.isAdmin,
  });

  const { data: tagSuggestions } = useQuery({
    queryKey: ["/api/admin/tag-suggestions"],
    enabled: isAdmin?.isAdmin,
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const tagForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      color: "#6b7280",
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: TagFormData) => {
      await apiRequest("POST", "/api/admin/tags", data);
    },
    onSuccess: () => {
      toast({
        title: "Тег создан",
        description: "Новый тег успешно создан",
      });
      tagForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tag-suggestions"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать тег",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      await apiRequest("POST", "/api/admin/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в админ панель",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка входа",
        description: "Неверные учетные данные",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      toast({
        title: "Выход выполнен",
        description: "Вы вышли из админ панели",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
    },
  });

  const approveChannelMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: number; isApproved: boolean }) => {
      await apiRequest("PATCH", `/api/channels/${id}/approval`, { isApproved });
    },
    onSuccess: () => {
      toast({
        title: "Канал обновлен",
        description: "Статус канала изменен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const approveReviewMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: number; isApproved: boolean }) => {
      await apiRequest("PATCH", `/api/reviews/${id}/approval`, { isApproved });
    },
    onSuccess: () => {
      toast({
        title: "Отзыв обновлен",
        description: "Статус отзыва изменен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const approveTagMutation = useMutation({
    mutationFn: async ({ suggestionId, name, color }: { suggestionId: number; name: string; color: string }) => {
      await apiRequest("POST", "/api/admin/approve-tag", { suggestionId, name, color });
    },
    onSuccess: () => {
      toast({
        title: "Тег одобрен",
        description: "Новый тег добавлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tag-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onTagSubmit = (data: TagFormData) => {
    createTagMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const goHome = () => {
    setLocation("/");
  };

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-[hsl(0,0%,10%)] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin?.isAdmin) {
    return (
      <div className="min-h-screen bg-[hsl(0,0%,10%)] flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={goHome}
              className="mb-4 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>
            <div className="w-16 h-16 bg-[hsl(205,100%,40%)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Админ панель</h1>
            <p className="text-gray-400">Войдите для управления каналами</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Имя пользователя</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите имя пользователя"
                          {...field}
                          className="bg-white/10 border-white/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Пароль</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Введите пароль"
                          {...field}
                          className="bg-white/10 border-white/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[hsl(205,100%,40%)] hover:bg-[hsl(205,100%,35%)] text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Вход..." : "Войти"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(0,0%,10%)] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[hsl(0,0%,18%)] border-r border-white/20">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-[hsl(205,100%,40%)] rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Админ панель</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "dashboard"
                  ? "bg-white/10 border border-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Главная</span>
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "channels"
                  ? "bg-white/10 border border-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Radio className="w-5 h-5" />
              <span>Каналы</span>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "reviews"
                  ? "bg-white/10 border border-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Отзывы</span>
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "tags"
                  ? "bg-white/10 border border-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Tags className="w-5 h-5" />
              <span>Теги</span>
            </button>

            <button
              onClick={() => setActiveTab("create-tag")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "create-tag"
                  ? "bg-white/10 border border-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Создать тег</span>
            </button>
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <Button
            onClick={goHome}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === "dashboard" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Обзор</h1>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Последнее обновление: сейчас
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Всего каналов</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stats?.totalChannels || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-[hsl(205,100%,40%)] rounded-full flex items-center justify-center">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Ожидают модерации</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">
                        {stats?.pendingChannels || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Всего отзывов</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stats?.totalReviews || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Активные теги</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stats?.activeTags || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <Tags className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "channels" && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Управление каналами</h1>
              <div className="space-y-4">
                {adminChannels?.map((channel: any) => (
                  <Card key={channel.id} className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{channel.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            {channel.subscriberCount} подписчиков
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={channel.isApproved ? "default" : "secondary"}>
                            {channel.isApproved ? "Одобрен" : "На модерации"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(channel.url, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{channel.description}</p>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => approveChannelMutation.mutate({ id: channel.id, isApproved: true })}
                          disabled={channel.isApproved}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Одобрить
                        </Button>
                        <Button
                          onClick={() => approveChannelMutation.mutate({ id: channel.id, isApproved: false })}
                          disabled={!channel.isApproved}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Управление отзывами</h1>
              <div className="space-y-4">
                {adminReviews?.map((review: any) => (
                  <Card key={review.id} className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">
                            Отзыв для канала #{review.channelId}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            Рейтинг: {review.rating}/5 звезд
                          </CardDescription>
                        </div>
                        <Badge variant={review.isApproved ? "default" : "secondary"}>
                          {review.isApproved ? "Одобрен" : "На модерации"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{review.comment}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          <div>Канал: {review.channel?.name || "Неизвестен"}</div>
                          <div>{review.isAnonymous ? "Анонимный отзыв" : `От: ${review.authorName}`}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => approveReviewMutation.mutate({ id: review.id, isApproved: true })}
                            disabled={review.isApproved}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Одобрить
                          </Button>
                          <Button
                            onClick={() => approveReviewMutation.mutate({ id: review.id, isApproved: false })}
                            disabled={!review.isApproved}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tags" && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Управление тегами</h1>
              <div className="space-y-4">
                {tagSuggestions?.map((suggestion: any) => (
                  <Card key={suggestion.id} className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{suggestion.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            Предложено: {suggestion.suggestedBy || "Анонимно"}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">На модерации</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => approveTagMutation.mutate({ 
                            suggestionId: suggestion.id, 
                            name: suggestion.name, 
                            color: "#3b82f6" 
                          })}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Одобрить
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "create-tag" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Создать тег</h1>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md">
                <Form {...tagForm}>
                  <form onSubmit={tagForm.handleSubmit(onTagSubmit)} className="space-y-4">
                    <FormField
                      control={tagForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Название тега</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Введите название тега"
                              {...field}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={tagForm.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Цвет тега</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-3">
                              <Input
                                type="color"
                                {...field}
                                className="w-16 h-10 bg-white/10 border-white/20 cursor-pointer"
                              />
                              <Input
                                placeholder="#6b7280"
                                {...field}
                                className="bg-white/10 border-white/20 text-white"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[hsl(205,100%,40%)] hover:bg-[hsl(205,100%,35%)] text-white"
                      disabled={createTagMutation.isPending}
                    >
                      {createTagMutation.isPending ? "Создаем..." : "Создать тег"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}