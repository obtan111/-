-- 检查所有分类及其菜品数量
SELECT 
    c.id,
    c.name,
    c.icon,
    COUNT(d.id) as dish_count
FROM categories c
LEFT JOIN dishes d ON c.id = d.category_id
GROUP BY c.id, c.name, c.icon
ORDER BY dish_count DESC;

-- 检查可能重复的分类（名称相似）
SELECT 
    c1.id as id1,
    c1.name as name1,
    c2.id as id2,
    c2.name as name2
FROM categories c1
JOIN categories c2 ON c1.id < c2.id
WHERE c1.name LIKE '%' || c2.name || '%' 
   OR c2.name LIKE '%' || c1.name || '%'
   OR c1.name = c2.name;

-- 检查汤类相关的所有菜品
SELECT 
    d.id,
    d.name,
    d.description,
    c.id as category_id,
    c.name as category_name,
    c.icon
FROM dishes d
JOIN categories c ON d.category_id = c.id
WHERE d.name LIKE '%汤%' 
   OR d.description LIKE '%汤%'
   OR c.name LIKE '%汤%'
ORDER BY c.name, d.name;
