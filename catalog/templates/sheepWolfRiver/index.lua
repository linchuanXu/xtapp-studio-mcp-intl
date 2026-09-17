local App = require("domain.game_app")

function on_load(ctx) App.start(ctx) end
function on_enter(ctx) App.enter(ctx) end
function on_input(ctx, ev) return App.input(ctx, ev) end
function on_draw(ctx, g) App.draw(ctx, g) end
