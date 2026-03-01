#!/bin/bash
# 添加HIT2服务器 - 先删除所有再添加

API_URL="https://ytsqawvrgzxgfluuadao.supabase.co"
API_KEY="sb_secret_4ynjxIudgE1ydSb3SR1a5A_gJGbGN5o"
GAME_ID="ad45f470-a636-45c3-b5c5-057e974cc0cd"

echo "删除所有服务器..."
ids=$(curl -s "$API_URL/rest/v1/Server?select=id" -H "apikey: $API_KEY" | python3 -c "import json,sys; print(' '.join([i['id'] for i in json.load(sys.stdin)]))")
for id in $ids; do
  curl -s -X DELETE "$API_URL/rest/v1/Server?id=eq.$id" -H "apikey: $API_KEY" 2>/dev/null &
done
wait

echo "添加原始世界服务器..."
for server in 奇奇 莉娜 阿妮卡 盧卡斯 雨果 阿黛爾 艾妲 維勒巴; do
  for i in 1 2 3 4 5; do
    curl -s -X POST "$API_URL/rest/v1/Server" \
      -H "apikey: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"gameId\": \"$GAME_ID\", \"name\": \"${server}${i}\", \"nameKo\": \" \", \"zone\": \"原始世界\"}" &
  done
done
wait

echo "添加平衡世界服务器..."
for server in 亞拉克奈斯 路米亞 因費爾多斯 克魯斯塔; do
  for i in 1 2 3 4; do
    curl -s -X POST "$API_URL/rest/v1/Server" \
      -H "apikey: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"gameId\": \"$GAME_ID\", \"name\": \"${server}${i}\", \"nameKo\": \" \", \"zone\": \"平衡世界\"}" &
  done
done
wait

echo "完成!"
