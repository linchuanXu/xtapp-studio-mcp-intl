-- 长任务看门狗切片：固件每次 start/feed 提供 11 秒片长，应用仍须维护
-- 更短的独立决策预算。watchdog 只对当前回调有效；正常完成仅清理本模块
-- 状态，绝不能调用 stop()（它的契约语义是退出应用）。
local M = {
  ctx = nil,
  started_ms = 0,
  last_ms = 0,
  interval_ms = 1000,
  max_runtime_ms = 2000,
}

local function now_ms(ctx)
  if ctx and ctx.sys and type(ctx.sys.millis) == "function" then return ctx.sys:millis() end
  return 0
end

local function elapsed_ms(now, started)
  if now < started then return 0 end
  return now - started
end

function M.begin(ctx, options)
  if M.ctx ~= nil then return nil, "already_active" end
  if type(ctx) ~= "table" or type(ctx.longtask) ~= "table" or type(ctx.longtask.start) ~= "function" then
    return nil, "disabled"
  end
  local ok, err = ctx.longtask:start()
  if ok ~= true then return nil, err or "disabled" end
  options = options or {}
  M.interval_ms = math.max(1000, math.min(2000, math.floor(tonumber(options.feed_interval_ms) or 1000)))
  M.max_runtime_ms = math.max(1, math.min(10000, math.floor(tonumber(options.max_runtime_ms) or 2000)))
  M.ctx = ctx
  M.started_ms = now_ms(ctx)
  M.last_ms = M.started_ms
  return true
end

function M.checkpoint()
  local ctx = M.ctx
  if type(ctx) ~= "table" then return nil, "inactive" end
  local now = now_ms(ctx)
  if elapsed_ms(now, M.started_ms) >= M.max_runtime_ms then return false, "app_budget_exhausted" end
  if elapsed_ms(now, M.last_ms) < M.interval_ms then return true end
  if type(ctx.longtask) ~= "table" or type(ctx.longtask.feed) ~= "function" then
    error("watchdog feed failed: inactive", 0)
  end
  local ok, err = ctx.longtask:feed()
  if ok ~= true then error("watchdog feed failed: " .. tostring(err or "inactive"), 0) end
  M.last_ms = now
  return true
end

-- 兼容既有策略调用点；新代码统一把它当可返回 false 的检查点。
M.feed = M.checkpoint

function M.finish()
  M.ctx = nil
  M.started_ms = 0
  M.last_ms = 0
end

return M
