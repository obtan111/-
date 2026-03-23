"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Star, 
  Plus, 
  Minus, 
  Trash2,
  Store,
  LogOut,
  Package,
  BarChart3,
  X,
  UserPlus,
  Sparkles,
  TrendingUp,
  Wand2,
  Loader2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  ShoppingBag,
  Bell,
  BellRing,
  AlertTriangle,
  Download,
  RefreshCw,
  MessageSquare,
  History,
  Undo2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// 飞入动画元素
interface FlyingItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  icon: string;
}

// 商家菜品列表组件
function MerchantDishesList({ 
  merchantDishes, 
  merchantCategoryFilter,
  categories,
  setEditingDish,
  setShowEditDishModal,
  toggleDishStatus
}: { 
  merchantDishes: any[];
  merchantCategoryFilter: number | null;
  categories: any[];
  setEditingDish: (dish: any) => void;
  setShowEditDishModal: (show: boolean) => void;
  toggleDishStatus: (id: number, active: boolean) => void;
}) {
  // 8个主要分类
  const mainCategories = [
    { id: 1, name: '热菜', icon: '🔥' },
    { id: 2, name: '凉菜', icon: '🥗' },
    { id: 3, name: '汤品', icon: '🍲' },
    { id: 4, name: '主食', icon: '🍚' },
    { id: 5, name: '小吃', icon: '🍢' },
    { id: 6, name: '甜品', icon: '🍰' },
    { id: 7, name: '饮料', icon: '🥤' },
    { id: 8, name: '水果', icon: '🍎' }
  ];
  
  // 按分类分组菜品
  const filteredDishes = merchantCategoryFilter
    ? merchantDishes.filter(d => d.category_id === merchantCategoryFilter)
    : merchantDishes;
  
  // 按8个主要分类分组
  const groupedDishes = mainCategories.reduce((acc: any, cat) => {
    acc[cat.id] = {
      category: cat,
      dishes: []
    };
    return acc;
  }, {});
  
  // 将菜品分配到对应的主要分类
  filteredDishes.forEach(dish => {
    // 找到对应的主要分类
    const dishCategoryName = dish.categories?.name || '';
    const matchingCategory = mainCategories.find(cat => 
      cat.name === dishCategoryName ||
      (dishCategoryName.includes('热') && cat.name === '热菜') ||
      (dishCategoryName.includes('凉') && cat.name === '凉菜') ||
      (dishCategoryName.includes('汤') && cat.name === '汤品') ||
      (dishCategoryName.includes('主') && cat.name === '主食') ||
      (dishCategoryName.includes('小') && cat.name === '小吃') ||
      (dishCategoryName.includes('甜') && cat.name === '甜品') ||
      (dishCategoryName.includes('饮') && cat.name === '饮料') ||
      (dishCategoryName.includes('水') && cat.name === '水果')
    );
    
    if (matchingCategory) {
      groupedDishes[matchingCategory.id].dishes.push(dish);
    } else {
      // 默认放入热菜分类
      groupedDishes[1].dishes.push(dish);
    }
  });
  
  // 只显示有菜品的分类
  const sortedGroupKeys = mainCategories
    .map(cat => cat.id.toString())
    .filter(id => groupedDishes[id].dishes.length > 0);
  
  if (filteredDishes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">该分类下暂无菜品</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      {sortedGroupKeys.map((groupKey) => {
        const group = groupedDishes[groupKey];
        if (!group) return null;
        
        return (
          <div key={groupKey} className="space-y-3">
            {/* 分类标题 */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <span className="text-2xl">{group.category.icon}</span>
              <h3 className="text-lg font-bold">{group.category.name}</h3>
              <Badge variant="secondary" className="ml-2">
                {group.dishes.length} 道菜
              </Badge>
            </div>
            
            {/* 该分类下的菜品网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.dishes.map((dish: any) => (
                <Card key={dish.id} className={`overflow-hidden ${!dish.is_active ? 'opacity-60' : ''}`}>
                  <div className="aspect-video bg-gray-100 relative">
                    {dish.image ? (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-orange-100 to-amber-100">
                        {dish.categories?.icon || '🍽️'}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={dish.is_active ? 'default' : 'secondary'}>
                        {dish.is_active ? '上架中' : '已下架'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{dish.name}</h3>
                      {dish.categories && (
                        <Badge variant="outline" className="text-xs">
                          {dish.categories.icon} {dish.categories.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {dish.description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-orange-500">¥{dish.price}</span>
                      <span className="text-sm text-muted-foreground">库存: {dish.stock}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>月销量: {dish.sales || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditingDish(dish);
                          setShowEditDishModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />编辑
                      </Button>
                      <Button 
                        size="sm" 
                        variant={dish.is_active ? 'destructive' : 'default'}
                        className="flex-1"
                        onClick={() => toggleDishStatus(dish.id, dish.is_active)}
                      >
                        {dish.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />下架
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />上架
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'user' | 'merchant' | null>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [semanticResults, setSemanticResults] = useState<any[]>([]);
  const [showSemanticResults, setShowSemanticResults] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  
  // 推荐类型：'hot' 热销菜品, 'personalized' 个性化推荐, 'related' 相关推荐, 'cart' 购物车推荐
  const [recommendType, setRecommendType] = useState<'hot' | 'personalized' | 'related' | 'cart'>('hot');
  
  // 商家后台状态
  const [merchantDishes, setMerchantDishes] = useState<any[]>([]);
  const [merchantDishesTotal, setMerchantDishesTotal] = useState<number>(0);
  const [merchantDishesPage, setMerchantDishesPage] = useState<number>(1);
  const [merchantDishesPerPage] = useState<number>(50);
  const [merchantOrders, setMerchantOrders] = useState<any[]>([]);
  const [merchantStats, setMerchantStats] = useState<any>(null);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [merchantCategoryFilter, setMerchantCategoryFilter] = useState<number | null>(null); // 商家菜品分类筛选
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishData, setNewDishData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '100',
    category_id: '',
    image: '',
  });
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<any>(null);
  
  // 新功能状态
  const [newOrderCount, setNewOrderCount] = useState(0); // 新订单通知
  const [lowStockDishes, setLowStockDishes] = useState<any[]>([]); // 低库存菜品
  const [showOrderTimeline, setShowOrderTimeline] = useState<number | null>(null); // 订单时间线弹窗
  const [orderRemark, setOrderRemark] = useState(''); // 订单备注
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkOrderId, setRemarkOrderId] = useState<number | null>(null);
  const [orderRemarkInput, setOrderRemarkInput] = useState(''); // 下单时的备注
  
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    isMerchant: false,
    shop_name: '',
    address: '',
  });

  // 初始化数据
  useEffect(() => {
    fetchCategories();
    fetchDishes();
    // 不再自动登录，用户需要手动登录
    fetchRecommendations('hot'); // 初始加载热门菜品
  }, []);
  
  // 当用户状态或订单状态变化时，更新推荐类型
  useEffect(() => {
    updateRecommendType();
  }, [user, orders, cart]);

  // 分类变化时重新获取菜品
  useEffect(() => {
    fetchDishes();
  }, [selectedCategory]);

  // 获取推荐（根据用户状态显示不同类型的推荐）
  const fetchRecommendations = async (type?: 'hot' | 'personalized' | 'related' | 'cart') => {
    const recommendTypeToUse = type || recommendType;
    try {
      let url = '/api/recommend?';
      
      // 根据推荐类型选择不同的推荐策略
      if (recommendTypeToUse === 'hot') {
        url += 'type=popular&limit=6';
      } else if (recommendTypeToUse === 'personalized') {
        url += 'type=hybrid&limit=6';
      } else if (recommendTypeToUse === 'related') {
        // 基于订单历史进行智能推荐
        url += 'type=order_based&limit=6';
      } else if (recommendTypeToUse === 'cart') {
        // 基于购物车的实时推荐
        url += 'type=cart_based&limit=6';
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data || []);
      }
    } catch (error) {
      console.error('获取推荐失败:', error);
    }
  };
  
  // 根据用户行为更新推荐类型
  const updateRecommendType = () => {
    if (!user) {
      setRecommendType('hot');
    } else if (cart && cart.items.length > 0) {
      // 购物车有商品，优先使用购物车推荐
      setRecommendType('cart');
    } else if (orders.length > 0) {
      // 有订单历史，显示相关推荐
      setRecommendType('related');
    } else {
      // 已登录但无订单和购物车，显示个性化推荐
      setRecommendType('personalized');
    }
  };

  // 检查认证状态
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
        setUserRole('user');
        fetchCart();
        fetchOrders();
        fetchRecommendations(); // 登录后重新获取推荐
      }
    } catch (error) {
      // 未登录
    }
  };

  // 获取分类（去重并限制为8个主要分类）
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        // 定义8个主要分类
        const mainCategories = [
          { id: 1, name: '热菜', icon: '🔥' },
          { id: 2, name: '凉菜', icon: '🥗' },
          { id: 3, name: '汤品', icon: '🍲' },
          { id: 4, name: '主食', icon: '🍚' },
          { id: 5, name: '小吃', icon: '🍢' },
          { id: 6, name: '甜品', icon: '🍰' },
          { id: 7, name: '饮料', icon: '🥤' },
          { id: 8, name: '水果', icon: '🍎' }
        ];
        setCategories(mainCategories);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  // 获取菜品
  const fetchDishes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (searchQuery) params.append('keyword', searchQuery);
      params.append('limit', '50');

      const res = await fetch(`/api/dishes?${params}`);
      const data = await res.json();
      if (data.success) {
        setDishes(data.data || []);
      }
    } catch (error) {
      console.error('获取菜品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 智能语义搜索
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('请输入搜索内容');
      return;
    }

    setSemanticLoading(true);
    setShowSemanticResults(true);
    
    try {
      const res = await fetch(`/api/recommend?type=semantic&query=${encodeURIComponent(searchQuery)}&limit=12`);
      const data = await res.json();
      
      if (data.success) {
        setSemanticResults(data.data || []);
        if (data.data.length === 0) {
          toast.info('未找到相关菜品，试试其他关键词');
        } else {
          toast.success(`找到 ${data.data.length} 道相关菜品`);
        }
      } else {
        toast.error(data.error || '搜索失败');
      }
    } catch (error) {
      toast.error('搜索失败，请稍后重试');
    } finally {
      setSemanticLoading(false);
    }
  };

  // 关闭语义搜索结果
  const closeSemanticResults = () => {
    setShowSemanticResults(false);
    setSemanticResults([]);
  };

  // 普通搜索
  const handleSearch = () => {
    setShowSemanticResults(false);
    fetchDishes();
  };

  // 获取购物车
  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      console.error('获取购物车失败:', error);
    }
  };

  // 获取订单
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    }
  };

  // ===== 商家后台功能 =====
  
  // 获取商家菜品列表（支持分页和分类筛选）
  const fetchMerchantDishes = async (page: number = 1, categoryId?: number | null) => {
    setMerchantLoading(true);
    try {
      const offset = (page - 1) * merchantDishesPerPage;
      let url = `/api/merchant/dishes?limit=${merchantDishesPerPage}&offset=${offset}`;
      
      // 如果指定了分类，添加分类筛选参数
      const catId = categoryId !== undefined ? categoryId : merchantCategoryFilter;
      if (catId) {
        url += `&category_id=${catId}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMerchantDishes(data.data || []);
        setMerchantDishesTotal(data.total || 0);
        setMerchantDishesPage(page);
      } else {
        toast.error(data.error || '获取菜品失败');
      }
    } catch (error) {
      toast.error('获取菜品失败');
    } finally {
      setMerchantLoading(false);
    }
  };

  // 获取商家订单列表
  const fetchMerchantOrders = async () => {
    setMerchantLoading(true);
    try {
      const params = orderStatusFilter ? `?status=${orderStatusFilter}` : '';
      const res = await fetch(`/api/merchant/orders${params}`);
      const data = await res.json();
      if (data.success) {
        setMerchantOrders(data.data || []);
      } else {
        toast.error(data.error || '获取订单失败');
      }
    } catch (error) {
      toast.error('获取订单失败');
    } finally {
      setMerchantLoading(false);
    }
  };

  // 获取商家销售统计
  const fetchMerchantStats = async () => {
    setMerchantLoading(true);
    try {
      const res = await fetch('/api/merchant/stats');
      const data = await res.json();
      if (data.success) {
        setMerchantStats(data.data);
      } else {
        toast.error(data.error || '获取统计失败');
      }
    } catch (error) {
      toast.error('获取统计失败');
    } finally {
      setMerchantLoading(false);
    }
  };

  // 切换菜品状态
  const toggleDishStatus = async (dishId: number, isActive: boolean) => {
    try {
      const res = await fetch('/api/merchant/dishes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: dishId, is_active: !isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isActive ? '菜品已下架' : '菜品已上架');
        fetchMerchantDishes(merchantDishesPage, merchantCategoryFilter);
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 更新菜品信息
  const handleEditDish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDish?.name || !editingDish?.price) {
      toast.error('请填写菜品名称和价格');
      return;
    }

    try {
      const res = await fetch('/api/merchant/dishes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dish_id: editingDish.id,
          name: editingDish.name,
          description: editingDish.description,
          price: editingDish.price,
          stock: editingDish.stock,
          category_id: editingDish.category_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('菜品信息更新成功');
        setShowEditDishModal(false);
        setEditingDish(null);
        fetchMerchantDishes(merchantDishesPage, merchantCategoryFilter);
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 添加新菜品
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDishData.name || !newDishData.price) {
      toast.error('请填写菜品名称和价格');
      return;
    }

    try {
      const res = await fetch('/api/merchant/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDishData.name,
          description: newDishData.description,
          price: newDishData.price,
          stock: parseInt(newDishData.stock) || 100,
          category_id: newDishData.category_id ? parseInt(newDishData.category_id) : null,
          image: newDishData.image,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('菜品添加成功');
        setShowAddDishModal(false);
        setNewDishData({ name: '', description: '', price: '', stock: '100', category_id: '', image: '' });
        fetchMerchantDishes(1); // 添加新菜品后回到第一页
      } else {
        toast.error(data.error || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  // 更新订单状态
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch('/api/merchant/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('订单状态更新成功');
        fetchMerchantOrders();
        fetchMerchantStats();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 监听商家tab变化，加载对应数据
  useEffect(() => {
    if (userRole === 'merchant' && user) {
      if (activeTab === 'dishes') {
        fetchMerchantDishes(1, merchantCategoryFilter);
      } else if (activeTab === 'orders') {
        fetchMerchantOrders();
      } else if (activeTab === 'stats') {
        fetchMerchantStats();
      }
    }
  }, [userRole, activeTab, orderStatusFilter]);

  // 监听分类筛选变化，重新加载菜品
  useEffect(() => {
    if (userRole === 'merchant' && user && activeTab === 'dishes') {
      fetchMerchantDishes(1, merchantCategoryFilter);
    }
  }, [merchantCategoryFilter]);

  // 订单实时通知 - 轮询检测新订单
  useEffect(() => {
    if (userRole !== 'merchant' || !user) return;

    let lastOrderCount = 0;
    
    const checkNewOrders = async () => {
      try {
        const res = await fetch('/api/merchant/orders?status=paid');
        const data = await res.json();
        if (data.success) {
          const pendingOrders = data.data || [];
          if (lastOrderCount > 0 && pendingOrders.length > lastOrderCount) {
            const newCount = pendingOrders.length - lastOrderCount;
            setNewOrderCount(prev => prev + newCount);
            toast.info(`🔔 您有 ${newCount} 个新订单待处理！`, {
              action: {
                label: '查看',
                onClick: () => setActiveTab('orders')
              }
            });
          }
          lastOrderCount = pendingOrders.length;
        }
      } catch (error) {
        console.error('检查新订单失败:', error);
      }
    };

    // 初始检查
    checkNewOrders();
    
    // 每15秒轮询一次
    const interval = setInterval(checkNewOrders, 15000);
    
    return () => clearInterval(interval);
  }, [userRole, user]);

  // 用户端订单状态轮询 - 实时更新订单状态
  useEffect(() => {
    if (userRole !== 'user' || !user) return;
    
    // 使用 ref 记录上次订单状态，避免闭包问题
    const prevOrderStatuses = new Map<number, string>();
    let isInitialized = false;
    
    const checkOrderUpdates = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && data.data) {
          const currentOrders = data.data;
          
          // 检测状态变化（仅在初始化后才通知）
          if (isInitialized) {
            currentOrders.forEach((order: any) => {
              const prevStatus = prevOrderStatuses.get(order.id);
              if (prevStatus && prevStatus !== order.status) {
                // 状态变化，显示通知
                const statusText: Record<string, string> = {
                  'paid': '已支付',
                  'preparing': '商家正在准备',
                  'ready': '餐品已备好',
                  'completed': '已完成',
                  'cancelled': '已取消',
                  'refunded': '已退款'
                };
                toast.success(`订单 #${order.id} 状态更新：${statusText[order.status] || order.status}`);
              }
            });
          }
          
          // 更新状态记录
          currentOrders.forEach((order: any) => {
            prevOrderStatuses.set(order.id, order.status);
          });
          isInitialized = true;
          
          // 更新订单列表
          setOrders(currentOrders);
        }
      } catch (error) {
        console.error('检查订单更新失败:', error);
      }
    };

    // 初始加载
    checkOrderUpdates();
    
    // 每10秒轮询一次订单状态
    const interval = setInterval(checkOrderUpdates, 10000);
    
    return () => clearInterval(interval);
  }, [userRole, user]);

  // 库存预警检查
  useEffect(() => {
    if (userRole !== 'merchant' || !user || merchantDishes.length === 0) return;
    
    const lowStock = merchantDishes.filter(dish => dish.stock < 20 && dish.is_active);
    setLowStockDishes(lowStock);
  }, [userRole, user, merchantDishes]);

  // 退款功能
  const handleRefund = async (orderId: number, refundReason: string) => {
    if (!refundReason.trim()) {
      toast.error('请填写退款原因');
      return;
    }
    
    if (!confirm('确定要退款吗？退款后订单将取消。')) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund_reason: refundReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('退款成功');
        fetchOrders();
      } else {
        toast.error(data.error || '退款失败');
      }
    } catch (error) {
      toast.error('退款失败');
    }
  };

  // 更新订单备注
  const updateOrderRemark = async () => {
    if (!remarkOrderId) return;
    
    try {
      const res = await fetch(`/api/orders/${remarkOrderId}/remark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: orderRemark }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('备注已更新');
        setShowRemarkModal(false);
        setRemarkOrderId(null);
        setOrderRemark('');
        fetchOrders();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 导出销售报表
  const exportStats = async () => {
    try {
      toast.info('正在生成报表...');
      const res = await fetch('/api/merchant/stats');
      const data = await res.json();
      
      if (data.success) {
        const stats = data.data;
        
        // 生成CSV内容
        let csv = '日期,收入,订单数\n';
        stats.last7Days.forEach((day: any) => {
          csv += `${day.date},${day.revenue},${day.orders}\n`;
        });
        csv += '\n热销菜品TOP10\n';
        csv += '排名,菜品名称,销量,单价,销售额\n';
        stats.topDishes.forEach((dish: any, index: number) => {
          csv += `${index + 1},${dish.name},${dish.sales},${dish.price},${(dish.sales * parseFloat(dish.price)).toFixed(2)}\n`;
        });
        
        // 下载文件
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `销售报表_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('报表导出成功');
      }
    } catch (error) {
      toast.error('导出失败');
    }
  };

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authData.username || !authData.password) {
      toast.error('请输入用户名和密码');
      return;
    }
    
    try {
      const endpoint = authData.isMerchant ? '/api/merchant/login' : '/api/user/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authData.username,
          password: authData.password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUser(authData.isMerchant ? data.data.merchant : data.data.user);
        setUserRole(authData.isMerchant ? 'merchant' : 'user');
        setShowAuthModal(false);
        resetAuthForm();
        toast.success('登录成功', { duration: 3000 });
        if (authData.isMerchant) {
          // 商家登录后默认显示菜单管理
          setActiveTab('dishes');
        } else {
          fetchCart();
          fetchOrders();
          fetchRecommendations(); // 登录后更新推荐
        }
      } else {
        // 明确显示错误信息，增加持续时间让用户能看清
        toast.error(authData.isMerchant 
          ? '商家账号不存在或密码错误，请检查身份选择是否正确' 
          : '用户账号不存在或密码错误，如需商家登录请选择"商家"身份',
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('登录错误:', error);
      toast.error('登录失败，请稍后重试');
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authData.password !== authData.confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }

    if (authData.password.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }

    try {
      if (authData.isMerchant) {
        const res = await fetch('/api/merchant/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: authData.username,
            email: authData.email,
            password: authData.password,
            shop_name: authData.shop_name,
            phone: authData.phone,
            address: authData.address,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('注册成功，请登录');
          setAuthMode('login');
          resetAuthForm();
        } else {
          toast.error(data.error || '注册失败');
        }
      } else {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: authData.username,
            email: authData.email,
            password: authData.password,
            phone: authData.phone,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('注册成功，请登录');
          setAuthMode('login');
          resetAuthForm();
        } else {
          toast.error(data.error || '注册失败');
        }
      }
    } catch (error) {
      toast.error('注册失败，请稍后重试');
    }
  };

  // 重置表单
  const resetAuthForm = () => {
    setAuthData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone: '',
      isMerchant: false,
      shop_name: '',
      address: '',
    });
  };

  // 登出
  const handleLogout = async () => {
    try {
      const endpoint = userRole === 'merchant' ? '/api/merchant/logout' : '/api/user/logout';
      await fetch(endpoint, { method: 'POST' });
      setUser(null);
      setUserRole(null);
      setCart(null);
      setOrders([]);
      setActiveTab('menu');
      fetchRecommendations(); // 退出后重新获取热门推荐
      toast.success('已退出登录');
    } catch (error) {
      toast.error('退出失败');
    }
  };

  // 飞入动画
  const triggerFlyAnimation = (startX: number, startY: number, icon: string) => {
    const cartButton = cartButtonRef.current;
    if (!cartButton) return;

    const cartRect = cartButton.getBoundingClientRect();
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const newItem: FlyingItem = {
      id: `fly-${Date.now()}`,
      startX,
      startY,
      endX,
      endY,
      icon,
    };

    setFlyingItems(prev => [...prev, newItem]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
    }, 800);
  };

  // 添加到购物车（带动画）
  const addToCart = async (dishId: number, event: React.MouseEvent, dishIcon: string = '🍽️') => {
    if (!user || userRole !== 'user') {
      setShowAuthModal(true);
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    triggerFlyAnimation(rect.left, rect.top, dishIcon);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: dishId, quantity: 1 }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('已添加到购物车');
        
        // 立即获取购物车数据
        await fetchCart();
        
        // 记录用户行为用于推荐
        fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dish_id: dishId, behavior_type: 'add_to_cart', score: 2 }),
        }).catch(() => {});

        // 立即更新推荐类型为相关推荐（基于购物车）
        setRecommendType('related');
        
        // 实时更新推荐（无延迟）
        await fetchRecommendations('related');
        
        console.log('购物车更新，实时刷新推荐');
      } else {
        toast.error(data.error || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  // 更新购物车
  const updateCart = async (dishId: number, quantity: number) => {
    if (quantity < 0) return;
    
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: dishId, quantity }),
      });

      const data = await res.json();
      if (data.success) {
        fetchCart();
        if (quantity === 0) {
          toast.success('已从购物车移除');
        }
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 清空购物车
  const clearCart = async () => {
    try {
      const res = await fetch('/api/cart', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCart(null);
        toast.success('购物车已清空');
      }
    } catch (error) {
      toast.error('清空失败');
    }
  };

  // 创建订单
  const createOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('购物车为空');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: user?.address || '默认地址',
          phone: user?.phone || '13800138000',
          remark: orderRemarkInput, // 添加备注
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('订单创建成功');
        setOrderRemarkInput(''); // 清空备注
        fetchCart();
        fetchOrders();
        setActiveTab('orders');
        
        // 订单创建后更新推荐
        setTimeout(() => {
          fetchRecommendations();
        }, 500);
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      toast.error('创建订单失败');
    }
  };

  // 支付订单
  const payOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: 'wechat' }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('支付成功');
        fetchOrders();
        fetchRecommendations(); // 支付后更新推荐
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('支付失败');
    }
  };

  // 取消订单
  const cancelOrder = async (orderId: number) => {
    if (!confirm('确定要取消订单吗？')) return;
    
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_reason: '用户取消' }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('订单已取消');
        fetchOrders();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('取消失败');
    }
  };

  // 确认收货
  const completeOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已确认收货');
        fetchOrders();
        fetchRecommendations(); // 收货后更新推荐
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 渲染飞入动画元素
  const renderFlyingItems = () => (
    <>
      {flyingItems.map(item => {
        // 计算从起点到终点的位移
        const deltaX = item.endX - item.startX;
        const deltaY = item.endY - item.startY;
        
        return (
          <div
            key={item.id}
            className="fixed z-[100] pointer-events-none"
            style={{
              left: item.startX,
              top: item.startY,
              animation: `flyToCart${item.id.replace(/-/g, '')} 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
            }}
          >
            <style jsx global>{`
              @keyframes flyToCart${item.id.replace(/-/g, '')} {
                0% {
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(1);
                }
                30% {
                  opacity: 1;
                  transform: translate(calc(-50% + ${deltaX * 0.3}px), calc(-50% + ${deltaY * 0.3 - 50}px)) scale(1.2);
                }
                100% {
                  opacity: 0;
                  transform: translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.3);
                }
              }
            `}</style>
            <div className="text-3xl">
              {item.icon}
            </div>
          </div>
        );
      })}
    </>
  );

  // 渲染认证弹窗
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {authMode === 'login' ? '🍜 登录' : '📝 注册'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowAuthModal(false); resetAuthForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                variant={authMode === 'login' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setAuthMode('login')}
              >
                登录
              </Button>
              <Button 
                variant={authMode === 'register' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setAuthMode('register')}
              >
                注册
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">身份：</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={!authData.isMerchant}
                    onChange={() => setAuthData({ ...authData, isMerchant: false })}
                  />
                  <span className="text-sm">顾客</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={authData.isMerchant}
                    onChange={() => setAuthData({ ...authData, isMerchant: true })}
                  />
                  <span className="text-sm">商家</span>
                </label>
              </div>

              <div>
                <Label>用户名 *</Label>
                <Input
                  type="text"
                  placeholder="请输入用户名"
                  value={authData.username}
                  onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                  required
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <Label>邮箱 *</Label>
                  <Input
                    type="email"
                    placeholder="请输入邮箱"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <Label>密码 *</Label>
                <Input
                  type="password"
                  placeholder="请输入密码"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  required
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <Label>确认密码 *</Label>
                    <Input
                      type="password"
                      placeholder="请再次输入密码"
                      value={authData.confirmPassword}
                      onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  {authData.isMerchant && (
                    <div>
                      <Label>店铺名称 *</Label>
                      <Input
                        type="text"
                        placeholder="请输入店铺名称"
                        value={authData.shop_name}
                        onChange={(e) => setAuthData({ ...authData, shop_name: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label>手机号</Label>
                    <Input
                      type="tel"
                      placeholder="请输入手机号"
                      value={authData.phone}
                      onChange={(e) => setAuthData({ ...authData, phone: e.target.value })}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                {authMode === 'login' ? '登录' : '注册'}
              </Button>

              {authMode === 'login' && (
                <p className="text-center text-sm text-gray-500">
                  还没有账号？
                  <Button variant="link" className="p-0 ml-1" onClick={() => setAuthMode('register')}>
                    立即注册
                  </Button>
                </p>
              )}
            </form>

            {authMode === 'login' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-1">测试账号：</p>
                <p className="text-blue-600">用户: demo_user / 123456</p>
                <p className="text-blue-600">商家: demo_merchant / 123456</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // 渲染AI推荐区域
  const renderRecommendations = () => {
    if (activeTab !== 'menu' || recommendations.length === 0) return null;
    
    // 根据推荐类型确定标题和说明
    const getRecommendTitle = () => {
      switch (recommendType) {
        case 'hot':
          return { title: '🔥 热销菜品', subtitle: '本店最受欢迎', badge: '热销' };
        case 'personalized':
          return { title: '✨ AI 智能推荐', subtitle: '为您量身定制', badge: '个性化' };
        case 'cart':
          return { title: '🛒 搭配推荐', subtitle: '基于您的购物车', badge: '搭配' };
        case 'related':
          return { title: '🎯 猜您喜欢', subtitle: '基于您的点单历史', badge: '相关推荐' };
        default:
          return { title: '🔥 热销菜品', subtitle: '本店最受欢迎', badge: '热销' };
      }
    };
    
    const { title, subtitle, badge } = getRecommendTitle();

    return (
      <Card className="mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-purple-200 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent font-bold">
              {title}
            </span>
            <Badge variant="secondary" className={`ml-2 text-xs ${
              recommendType === 'hot' ? 'bg-orange-100 text-orange-700' :
              recommendType === 'cart' ? 'bg-blue-100 text-blue-700' :
              recommendType === 'related' ? 'bg-green-100 text-green-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {badge}
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {recommendations.map((dish: any) => (
              <div
                key={dish.id}
                className="bg-white rounded-xl p-3 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group border border-gray-100"
              >
                <div className="text-3xl mb-2 text-center group-hover:scale-125 transition-transform duration-300">
                  {dish.categories?.icon || '🍽️'}
                </div>
                <h4 className="font-medium text-sm text-center truncate mb-1">{dish.name}</h4>
                <p className="text-sm font-bold text-orange-500 text-center mb-2">¥{dish.price}</p>
                {dish.similarity && (
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(dish.similarity * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(dish.similarity * 100)}%</span>
                  </div>
                )}
                <Button 
                  size="sm" 
                  className="w-full text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(dish.id, e, dish.categories?.icon || '🍽️');
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />加入
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // 渲染语义搜索结果
  const renderSemanticResults = () => {
    if (!showSemanticResults) return null;

    return (
      <Card className="mb-6 border-2 border-purple-200 bg-purple-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wand2 className="h-5 w-5 text-purple-500" />
              <span className="text-purple-700">AI 语义搜索结果</span>
              <Badge variant="secondary" className="text-xs">
                "{searchQuery}"
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={closeSemanticResults}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {semanticLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-2 text-purple-600">AI 正在理解您的需求...</span>
            </div>
          ) : semanticResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              未找到相关菜品，请尝试其他描述
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {semanticResults.map((dish: any) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-xl p-3 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group border border-purple-100"
                >
                  <div className="text-3xl mb-2 text-center group-hover:scale-125 transition-transform duration-300">
                    {dish.categories?.icon || '🍽️'}
                  </div>
                  <h4 className="font-medium text-sm text-center truncate mb-1">{dish.name}</h4>
                  <p className="text-xs text-gray-500 text-center mb-1 truncate">{dish.description}</p>
                  <p className="text-sm font-bold text-orange-500 text-center mb-2">¥{dish.price}</p>
                  {dish.similarity && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${Math.min(dish.similarity * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(dish.similarity * 100)}%</span>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(dish.id, e, dish.categories?.icon || '🍽️');
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />加入购物车
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 渲染商家后台
  if (userRole === 'merchant') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderAuthModal()}
        {renderFlyingItems()}
        
        {/* 添加菜品弹窗 */}
        {showAddDishModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>添加新菜品</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddDishModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDish} className="space-y-4">
                  <div>
                    <Label>菜品名称 *</Label>
                    <Input
                      placeholder="请输入菜品名称"
                      value={newDishData.name}
                      onChange={(e) => setNewDishData({ ...newDishData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>价格 *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="请输入价格"
                      value={newDishData.price}
                      onChange={(e) => setNewDishData({ ...newDishData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>描述</Label>
                    <Textarea
                      placeholder="请输入菜品描述"
                      value={newDishData.description}
                      onChange={(e) => setNewDishData({ ...newDishData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>库存</Label>
                    <Input
                      type="number"
                      placeholder="默认100"
                      value={newDishData.stock}
                      onChange={(e) => setNewDishData({ ...newDishData, stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>分类</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={newDishData.category_id}
                      onChange={(e) => setNewDishData({ ...newDishData, category_id: e.target.value })}
                    >
                      <option value="">选择分类</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">添加菜品</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddDishModal(false)}>取消</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 编辑菜品弹窗 */}
        {showEditDishModal && editingDish && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>编辑菜品</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setShowEditDishModal(false); setEditingDish(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditDish} className="space-y-4">
                  <div>
                    <Label>菜品名称 *</Label>
                    <Input
                      placeholder="请输入菜品名称"
                      value={editingDish.name}
                      onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>价格 *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="请输入价格"
                      value={editingDish.price}
                      onChange={(e) => setEditingDish({ ...editingDish, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>描述</Label>
                    <Textarea
                      placeholder="请输入菜品描述"
                      value={editingDish.description || ''}
                      onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>库存</Label>
                    <Input
                      type="number"
                      placeholder="库存数量"
                      value={editingDish.stock}
                      onChange={(e) => setEditingDish({ ...editingDish, stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>分类</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={editingDish.category_id || ''}
                      onChange={(e) => setEditingDish({ ...editingDish, category_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      <option value="">选择分类</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">保存修改</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowEditDishModal(false); setEditingDish(null); }}>取消</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 订单备注弹窗 */}
        {showRemarkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>订单备注</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setShowRemarkModal(false); setRemarkOrderId(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); updateOrderRemark(); }} className="space-y-4">
                  <div>
                    <Label>备注内容</Label>
                    <Textarea
                      placeholder="请输入备注信息..."
                      value={orderRemark}
                      onChange={(e) => setOrderRemark(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">保存备注</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowRemarkModal(false); setRemarkOrderId(null); }}>取消</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-6 w-6 text-orange-500" />
              <h1 className="text-xl font-bold">{user?.shop_name}</h1>
              <Badge variant="secondary">商家后台</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
                <Store className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">
                  尊敬的商家: {user?.username}
                </span>
              </div>
              
              {/* 新订单通知 */}
              {newOrderCount > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="animate-pulse"
                  onClick={() => { setNewOrderCount(0); setActiveTab('orders'); }}
                >
                  <BellRing className="h-4 w-4 mr-2" />
                  {newOrderCount} 个新订单
                </Button>
              )}
              
              {/* 库存预警 */}
              {lowStockDishes.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-orange-600 border-orange-300"
                  onClick={() => setActiveTab('dishes')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {lowStockDishes.length} 个库存预警
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeTab === 'dishes' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('dishes')}
                >
                  <Package className="h-4 w-4 mr-2" />菜品管理
                </Button>
                <Button 
                  variant={activeTab === 'orders' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('orders')}
                  className="relative"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />订单管理
                  {newOrderCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {newOrderCount}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={activeTab === 'stats' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('stats')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />销售报表
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />退出
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* 库存预警提示 */}
          {lowStockDishes.length > 0 && activeTab === 'dishes' && (
            <Card className="mb-4 border-orange-200 bg-orange-50">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">库存预警：</span>
                  <span className="text-sm">
                    {lowStockDishes.map(d => `${d.name}(${d.stock}件)`).join('、')} 库存不足20件，请及时补货
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {merchantLoading && activeTab !== 'dishes' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2">加载中...</span>
            </div>
          )}
          
          {/* 菜品管理 */}
          {activeTab === 'dishes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">菜品管理</h2>
                <div className="flex items-center gap-2">
                  {/* 分类筛选 */}
                  <select
                    className="px-3 py-2 border rounded-md text-sm bg-white"
                    value={merchantCategoryFilter || ''}
                    onChange={(e) => setMerchantCategoryFilter(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">全部分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => setShowAddDishModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />添加菜品
                  </Button>
                </div>
              </div>
              
              {/* 分类标签快捷筛选 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={merchantCategoryFilter === null ? 'default' : 'outline'}
                  onClick={() => setMerchantCategoryFilter(null)}
                  className="rounded-full"
                >
                  全部
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={merchantCategoryFilter === cat.id ? 'default' : 'outline'}
                    onClick={() => setMerchantCategoryFilter(cat.id)}
                    className="rounded-full"
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.name}
                  </Button>
                ))}
              </div>
              
              {/* 菜品总数统计 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>共 {merchantDishesTotal} 道菜品</span>
                {merchantDishesTotal > merchantDishesPerPage && (
                  <span>第 {merchantDishesPage} 页 / 共 {Math.ceil(merchantDishesTotal / merchantDishesPerPage)} 页</span>
                )}
              </div>
              
              {merchantLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : merchantDishes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">暂无菜品，请添加</p>
                    <Button onClick={() => setShowAddDishModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />添加第一个菜品
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <MerchantDishesList 
                    merchantDishes={merchantDishes} 
                    merchantCategoryFilter={merchantCategoryFilter}
                    categories={categories}
                    setEditingDish={setEditingDish}
                    setShowEditDishModal={setShowEditDishModal}
                    toggleDishStatus={toggleDishStatus}
                  />
                  
                  {/* 分页控制 */}
                  {merchantDishesTotal > merchantDishesPerPage && (
                    <div className="flex items-center justify-center gap-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={merchantDishesPage <= 1}
                        onClick={() => fetchMerchantDishes(merchantDishesPage - 1, merchantCategoryFilter)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />上一页
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {merchantDishesPage} / {Math.ceil(merchantDishesTotal / merchantDishesPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={merchantDishesPage >= Math.ceil(merchantDishesTotal / merchantDishesPerPage)}
                        onClick={() => fetchMerchantDishes(merchantDishesPage + 1, merchantCategoryFilter)}
                      >
                        下一页<ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 订单管理 */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">订单管理</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    共 {merchantOrders.length} 个订单
                    {merchantOrders.filter(o => o.status === 'paid').length > 0 && (
                      <span className="ml-2 text-orange-600 font-medium">
                        • {merchantOrders.filter(o => o.status === 'paid').length} 个待处理
                      </span>
                    )}
                    {merchantOrders.filter(o => o.status === 'preparing').length > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        • {merchantOrders.filter(o => o.status === 'preparing').length} 个准备中
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchMerchantOrders}
                    className="hidden sm:flex"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />刷新
                  </Button>
                  <select
                    className="px-3 py-2 border rounded-md text-sm bg-white"
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="">全部状态</option>
                    <option value="paid">🆕 待处理</option>
                    <option value="preparing">👨‍🍳 准备中</option>
                    <option value="ready">📦 待取餐</option>
                    <option value="completed">✅ 已完成</option>
                    <option value="cancelled">❌ 已取消</option>
                  </select>
                </div>
              </div>
              
              {/* 订单统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { status: '', label: '全部', count: merchantOrders.length, color: 'bg-gray-100 text-gray-700' },
                  { status: 'paid', label: '待处理', count: merchantOrders.filter(o => o.status === 'paid').length, color: 'bg-orange-100 text-orange-700' },
                  { status: 'preparing', label: '准备中', count: merchantOrders.filter(o => o.status === 'preparing').length, color: 'bg-blue-100 text-blue-700' },
                  { status: 'ready', label: '待取餐', count: merchantOrders.filter(o => o.status === 'ready').length, color: 'bg-purple-100 text-purple-700' },
                  { status: 'completed', label: '已完成', count: merchantOrders.filter(o => o.status === 'completed').length, color: 'bg-green-100 text-green-700' },
                ].map(({ status, label, count, color }) => (
                  <button
                    key={status || 'all'}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      orderStatusFilter === status ? 'ring-2 ring-orange-500 ' + color : 'bg-white border hover:shadow-md'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-xl font-bold ${orderStatusFilter === status ? '' : 'text-gray-900'}`}>
                      {count}
                    </p>
                  </button>
                ))}
              </div>
              
              {merchantLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : merchantOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">暂无订单</p>
                    <p className="text-sm text-muted-foreground">新订单将显示在这里</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {merchantOrders
                    .filter(order => !orderStatusFilter || order.status === orderStatusFilter)
                    .map((order) => (
                    <Card key={order.id} className={order.status === 'paid' ? 'border-orange-300 shadow-md' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">订单号: {order.order_no}</CardTitle>
                              {order.status === 'paid' && (
                                <Badge className="bg-orange-500 animate-pulse">新订单</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(order.created_at).toLocaleString('zh-CN')} | 
                              {order.users ? ` 顾客: ${order.users.username || order.users.phone || '未知'}` : ' 顾客信息未知'}
                            </p>
                          </div>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'cancelled' ? 'destructive' : 
                            order.status === 'paid' ? 'secondary' : 'outline'
                          } className={order.status === 'paid' ? 'bg-orange-500 text-white' : ''}>
                            {order.status === 'pending' ? '待支付' :
                             order.status === 'paid' ? '待处理' :
                             order.status === 'preparing' ? '准备中' :
                             order.status === 'ready' ? '待取餐' :
                             order.status === 'completed' ? '已完成' : '已取消'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm py-1">
                              <span className="font-medium">{item.dish_name} x {item.quantity}</span>
                              <span className="text-muted-foreground">¥{item.subtotal}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="font-semibold">
                            总计: <span className="text-orange-500 text-lg">¥{order.total_price}</span>
                          </span>
                          <div className="flex gap-2">
                            {order.status === 'paid' && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                                <CheckCircle className="h-4 w-4 mr-1" />接单并开始准备
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                                <Truck className="h-4 w-4 mr-1" />出餐完成
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                等待顾客取餐
                              </div>
                            )}
                            {(order.status === 'paid' || order.status === 'preparing') && (
                              <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                                取消订单
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 销售报表 */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">销售报表</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    数据更新时间: {new Date().toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchMerchantStats}
                    className="hidden sm:flex"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />刷新数据
                  </Button>
                  <Button onClick={exportStats} variant="outline">
                    <Download className="h-4 w-4 mr-2" />导出报表
                  </Button>
                </div>
              </div>
              
              {!merchantStats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : (
                <>
                  {/* 核心指标卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                            <ShoppingBag className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-700 font-medium">总订单数</p>
                            <p className="text-2xl font-bold text-blue-900">{merchantStats.summary?.totalOrders || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-500 rounded-full shadow-lg">
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-green-700 font-medium">总收入</p>
                            <p className="text-2xl font-bold text-green-900">¥{merchantStats.summary?.totalRevenue || '0.00'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-orange-500 rounded-full shadow-lg">
                            <BarChart3 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-orange-700 font-medium">客单价</p>
                            <p className="text-2xl font-bold text-orange-900">
                              ¥{merchantStats.summary?.totalOrders > 0 
                                ? (parseFloat(merchantStats.summary?.totalRevenue || '0') / merchantStats.summary?.totalOrders).toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500 rounded-full shadow-lg">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-purple-700 font-medium">热销菜品</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {merchantStats.topDishes?.length || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 实时订单状态概览 */}
                  <Card className="bg-gradient-to-r from-gray-50 to-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        实时订单状态
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { status: 'pending', label: '待支付', icon: '⏳', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                          { status: 'paid', label: '待处理', icon: '🆕', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                          { status: 'preparing', label: '准备中', icon: '👨‍🍳', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                          { status: 'ready', label: '待取餐', icon: '📦', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                          { status: 'completed', label: '已完成', icon: '✅', color: 'bg-green-100 text-green-700 border-green-200' },
                        ].map(({ status, label, icon, color }) => {
                          const count = merchantStats.summary?.statusStats?.[status] || 0;
                          return (
                            <div key={status} className={`p-3 rounded-lg border-2 ${color} text-center`}>
                              <span className="text-2xl">{icon}</span>
                              <p className="text-xl font-bold mt-1">{count}</p>
                              <p className="text-xs font-medium">{label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 近7天销售趋势 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          近7天销售趋势
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {merchantStats.last7Days?.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">暂无数据</p>
                        ) : (
                          <div className="space-y-3">
                            {merchantStats.last7Days?.map((day: any) => {
                              const maxRevenue = Math.max(...(merchantStats.last7Days?.map((d: any) => d.revenue) || [1]));
                              const widthPercent = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                              
                              return (
                                <div key={day.date} className="flex items-center gap-3">
                                  <span className="w-20 text-sm text-muted-foreground">{day.date}</span>
                                  <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden relative">
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium">
                                      ¥{day.revenue.toFixed(2)}
                                    </span>
                                  </div>
                                  <span className="w-14 text-sm text-muted-foreground text-right">
                                    {day.orders}单
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 热销菜品排行 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          热销菜品 TOP 10
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {merchantStats.topDishes?.length === 0 ? (
                          <div className="text-center py-8">
                            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">暂无销售数据</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {merchantStats.topDishes?.map((dish: any, index: number) => (
                              <div key={dish.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                  index === 1 ? 'bg-gray-300 text-gray-700' :
                                  index === 2 ? 'bg-orange-300 text-orange-800' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{dish.name}</p>
                                  <p className="text-xs text-muted-foreground">¥{dish.price}/份</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-500">{dish.sales}份</p>
                                  <p className="text-xs text-muted-foreground">
                                    ¥{(parseFloat(dish.price) * dish.sales).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* 经营建议 */}
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        智能经营建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-indigo-800">
                        {merchantStats.summary?.statusStats?.paid > 3 && (
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            有 {merchantStats.summary?.statusStats?.paid} 个订单待处理，建议及时接单
                          </p>
                        )}
                        {merchantStats.topDishes?.length > 0 && (
                          <p className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            今日热销: {merchantStats.topDishes[0]?.name}，建议确保库存充足
                          </p>
                        )}
                        {merchantStats.summary?.totalOrders > 0 && (
                          <p className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                            平均客单价 ¥{(parseFloat(merchantStats.summary?.totalRevenue || '0') / merchantStats.summary?.totalOrders).toFixed(2)}，
                            {parseFloat(merchantStats.summary?.totalRevenue || '0') / merchantStats.summary?.totalOrders > 30 
                              ? '客单价表现良好' : '可考虑推出套餐提升客单价'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // 渲染用户端
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {renderAuthModal()}
      {renderFlyingItems()}
      
      {/* 头部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍜</span>
            <h1 className="text-xl font-bold text-gray-900">云点餐系统</h1>
          </div>
          
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索菜品或描述需求(如：减脂期吃什么)"
                className="pl-10 pr-20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSemanticSearch}
              disabled={semanticLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
            >
              {semanticLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">AI搜索</span>
            </Button>
            <Button size="sm" onClick={handleSearch}>搜索</Button>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">
                    欢迎, {user?.username}
                  </span>
                </div>
                
                <Button 
                  variant={activeTab === 'menu' ? 'default' : 'ghost'} 
                  onClick={() => {
                    setActiveTab('menu');
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setShowSemanticResults(false);
                    toast.success('已切换到菜单');
                  }}
                >
                  🍽️ 菜单
                </Button>
                <Button 
                  variant={activeTab === 'orders' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('orders')}
                >
                  <Package className="h-4 w-4 mr-2" />我的订单
                </Button>
                <Button 
                  ref={cartButtonRef}
                  variant={activeTab === 'cart' ? 'default' : 'outline'} 
                  onClick={() => setActiveTab('cart')}
                  className="relative"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cart?.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {cart.itemCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />退出
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                >
                  <User className="h-4 w-4 mr-2" />登录
                </Button>
                <Button 
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />注册
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 分类标签 */}
        <div className="border-t">
          <div className="container mx-auto px-4 py-2">
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                全部
              </Button>
              {/* 只显示前6个分类 */}
              {categories.slice(0, 6).map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
              {/* 其他分类下拉菜单 */}
              {categories.length > 6 && (
                <select
                  className="px-3 py-1.5 text-sm border rounded-md bg-white"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">更多分类</option>
                  {categories.slice(6).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {/* 语义搜索结果 */}
        {renderSemanticResults()}
        
        {/* AI推荐区域 */}
        {activeTab === 'menu' && renderRecommendations()}
        
        {/* 菜单 */}
        {activeTab === 'menu' && !showSemanticResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
                <p className="text-muted-foreground mt-2">加载中...</p>
              </div>
            ) : dishes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">暂无菜品</p>
              </div>
            ) : (
              dishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-video bg-gray-100 relative">
                    {dish.image ? (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-100 to-amber-100">
                        {dish.categories?.icon || '🍽️'}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{dish.name}</h3>
                      {dish.categories && (
                        <Badge variant="secondary">{dish.categories.icon} {dish.categories.name}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {dish.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-muted-foreground">月销 {dish.sales || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-orange-500">
                        ¥{dish.price}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={(e) => addToCart(dish.id, e, dish.categories?.icon || '🍽️')}
                      >
                        <Plus className="h-4 w-4 mr-1" />加入购物车
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* 购物车 */}
        {activeTab === 'cart' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🛒 购物车</span>
                {cart?.itemCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4 mr-2" />清空
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">请先登录后查看购物车</p>
                  <Button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                    去登录
                  </Button>
                </div>
              ) : !cart || cart.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">购物车为空</p>
                  <Button onClick={() => setActiveTab('menu')}>去选购</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.dishes?.name || '未知菜品'}</h4>
                          <p className="text-sm text-muted-foreground">¥{item.dishes?.price || 0}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCart(item.dish_id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCart(item.dish_id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 订单备注 */}
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground">订单备注（选填）</Label>
                    <Textarea
                      placeholder="如：少盐、不要香菜、尽快送达等..."
                      value={orderRemarkInput}
                      onChange={(e) => setOrderRemarkInput(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  
                  <div className="mt-6 pt-4 border-t flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      总计: <span className="text-orange-500 text-xl">¥{cart.totalPrice}</span>
                    </div>
                    <Button onClick={createOrder} size="lg">立即下单</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 我的订单 */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {!user ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">请先登录后查看订单</p>
                  <Button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                    去登录
                  </Button>
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">暂无订单</p>
                  <Button onClick={() => setActiveTab('menu')}>去点餐</Button>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">订单号: {order.order_no}</CardTitle>
                        <p className="text-sm text-muted-foreground">{order.created_at}</p>
                      </div>
                      <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'cancelled' ? 'destructive' :
                        order.status === 'refunded' ? 'destructive' : 'secondary'
                      }>
                        {order.status === 'pending' ? '待支付' :
                         order.status === 'paid' ? '已支付' :
                         order.status === 'preparing' ? '准备中' :
                         order.status === 'ready' ? '待取餐' :
                         order.status === 'completed' ? '已完成' :
                         order.status === 'refunded' ? '已退款' : '已取消'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.dish_name} x {item.quantity}</span>
                          <span>¥{item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* 订单备注显示 */}
                    {order.remark && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-medium">备注：</span>
                          <span>{order.remark}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 订单时间线 */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <History className="h-4 w-4" />
                        订单进度
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {(() => {
                          // 根据订单状态判断当前进度
                          const statusOrder = ['pending', 'paid', 'preparing', 'ready', 'completed'];
                          const currentIdx = statusOrder.indexOf(order.status);
                          
                          return [
                            { status: 'pending', label: '下单' },
                            { status: 'paid', label: '支付' },
                            { status: 'preparing', label: '准备' },
                            { status: 'ready', label: '备好' },
                            { status: 'completed', label: '完成' },
                          ].map((step, idx, arr) => {
                            // 当前步骤及之前的步骤都标记为已完成
                            const isCompleted = idx <= currentIdx || order.status === 'cancelled' || order.status === 'refunded';
                            const isCurrent = idx === currentIdx;
                            
                            return (
                              <div key={step.status} className="flex items-center">
                                <div className={`flex flex-col items-center ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-orange-400 text-white' : 'bg-gray-200'
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <span className={`mt-1 ${isCurrent ? 'font-bold' : ''}`}>{step.label}</span>
                                </div>
                                {idx < arr.length - 1 && (
                                  <div className={`w-8 h-0.5 mx-1 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="font-semibold">总计: <span className="text-orange-500">¥{order.total_price}</span></span>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {/* 添加/修改备注 */}
                        {['pending', 'paid'].includes(order.status) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setRemarkOrderId(order.id);
                              setOrderRemark(order.remark || '');
                              setShowRemarkModal(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {order.remark ? '修改备注' : '添加备注'}
                          </Button>
                        )}
                        
                        {order.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => payOrder(order.id)}>支付</Button>
                            <Button size="sm" variant="outline" onClick={() => cancelOrder(order.id)}>取消订单</Button>
                          </>
                        )}
                        {order.status === 'paid' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => cancelOrder(order.id)}>取消订单</Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('请输入退款原因：');
                                if (reason) handleRefund(order.id, reason);
                              }}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />申请退款
                            </Button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => cancelOrder(order.id)}>取消订单</Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('请输入退款原因：');
                                if (reason) handleRefund(order.id, reason);
                              }}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />申请退款
                            </Button>
                          </>
                        )}
                        {order.status === 'ready' && (
                          <Button size="sm" onClick={() => completeOrder(order.id)}>确认收货</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
