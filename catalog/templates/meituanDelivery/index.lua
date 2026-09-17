local B,W=15,0
local stages={{at=0,title="商家已接单",detail="观澜湖店开始制作",eta=32},{at=35,title="骑手已接单",detail="周师傅正前往商家",eta=26},{at=85,title="骑手已到店",detail="正在观澜湖新城取餐",eta=18},{at=145,title="配送中",detail="距观澜湖园区1.2公里",eta=9},{at=215,title="即将送达",detail="骑手已进入观澜湖园区",eta=2},{at=255,title="订单已送达",detail="餐品已放园区前台",eta=0}}
local function now(ctx) return ctx.sys:local_sec() or math.floor(ctx.sys:millis()/1000) end
local function current(ctx) local sec=math.max(0,now(ctx)-ctx.state.delivery.started); local n=1; for i,v in ipairs(stages) do if sec>=v.at then n=i end end; return sec,n,stages[n] end
local function replay(ctx) ctx.state.delivery.started=now(ctx); ctx:invalidate() end
function on_load(ctx) if not ctx.state.delivery then ctx.state.delivery={started=now(ctx)} end; ctx:set_tick_rate("low") end
function on_enter(ctx) ctx:invalidate() end
function on_tick(ctx) ctx:invalidate() end
function on_draw(ctx,g)
  local sec,n,s=current(ctx); g:clear(W); g:image("brand_logo",24,18); g:text(370,32,"尾号6281",{color=B}); g:line(24,78,456,78,B)
  g:image("feature_scene",216,98); g:text(24,120,s.eta>0 and "预计送达" or "已送达",{color=B}); g:text(24,170,s.eta>0 and (s.eta.." 分钟") or "前台取餐",{color=B}); g:line(24,216,194,216,B)
  g:image(n>=6 and "icon_done" or n>=4 and "icon_rider" or "icon_store",24,270); g:text(90,272,s.title,{color=B}); g:text(90,310,s.detail,{color=B})
  local labels={"接单","骑手","到店","配送","送达"}; for i=1,5 do local x=42+(i-1)*94; g:circle(x,370,9,i<=math.min(n,5) and "fill" or "stroke",B); if i<5 then g:line(x+10,370,x+84,370,B) end; g:text(x-18,392,labels[i],{color=B}) end
  g:line(24,438,456,438,B); g:text(24,458,"配送动态",{color=B}); local events={{0,"12:18","观澜湖店确认订单"},{35,"12:19","周师傅接单"},{85,"12:20","骑手在新城取餐"},{145,"12:21","餐品前往观澜湖园区"},{215,"12:22","骑手进入观澜湖园区"}}; local row=0; for _,v in ipairs(events) do if sec>=v[1] then local y=500+row*38; g:text(24,y,v[2],{color=B}); g:text(104,y,v[3],{color=B}); g:line(104,y+28,456,y+28,B); row=row+1 end end
  g:rect(24,714,204,58,"stroke",B); g:rect(24,714,5,58,"fill",B); g:text(78,732,"重新计时",{color=B}); g:rect(252,714,204,58,"stroke",B); g:text(306,732,"设为锁屏",{color=B})
end
function on_input(ctx,ev) if ev.type=="touch" and ev.gesture=="tap" and ev.y>=690 then if ev.x<240 then replay(ctx) else ctx.system:set_as_lockscreen_app(); ctx:invalidate() end; return true end; return false end
