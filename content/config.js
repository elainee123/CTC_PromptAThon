(() => {
  'use strict';

  // Configuration and constants for the Impulse Buy Blocker extension.
  window.IB_Config = {
    // Regex patterns to identify buy buttons by their text/classes/ids
    BUY_PATTERNS: [
      /buy\s*now/i, /place\s*(your\s*)?order/i, /add\s*to\s*cart/i,
      /checkout/i, /complete\s*(your\s*)?purchase/i,
      /proceed\s*to\s*(checkout|payment)/i, /pay\s*now/i,
      /order\s*now/i, /purchase/i, /submit\s*order/i,
      /confirm\s*(and\s*)?(pay|order)/i
    ],

    // CSS selectors for common elements that represent buy/checkout links and buttons
    BUTTON_SELECTORS: 'button, input[type="submit"], input[type="button"], a[role="button"], [data-action*="buy"], [data-action*="cart"], [data-action*="checkout"], #buy-now, #add-to-cart, .buy-btn, .add-to-cart, .checkout-btn, [name="submit.buy"], [name="add-to-cart"]',

    // Fun comparisons to show instead of spending: emoji, unit price, singular label, plural label
    COMPARISONS: [
      { emoji: '🧋', cost: 7.50,  sing: 'boba tea',         plur: 'boba teas' },
      { emoji: '🌮', cost: 3.50,  sing: 'street taco',      plur: 'street tacos' },
      { emoji: '🍕', cost: 3.00,  sing: 'pizza slice',      plur: 'pizza slices' },
      { emoji: '🍔', cost: 12.00, sing: 'smash burger',     plur: 'smash burgers' },
      { emoji: '🎵', cost: 11.99, sing: 'month of Spotify', plur: 'months of Spotify' },
      { emoji: '📺', cost: 15.49, sing: 'month of Netflix', plur: 'months of Netflix' },
      { emoji: '🐶', cost: 35.00, sing: 'dog grooming',     plur: 'dog groomings' },
      { emoji: '💅', cost: 45.00, sing: 'mani-pedi',        plur: 'mani-pedis' },
      { emoji: '⛽', cost: 55.00, sing: 'tank of gas',      plur: 'tanks of gas' },
      { emoji: '🧁', cost: 4.50,  sing: 'fancy cupcake',    plur: 'fancy cupcakes' },
      { emoji: '🍿', cost: 15.00, sing: 'movie ticket',     plur: 'movie tickets' },
      { emoji: '🥑', cost: 8.00,  sing: 'avocado toast',    plur: 'avocado toasts' },
      { emoji: '🧀', cost: 14.00, sing: 'charcuterie',      plur: 'charcuteries' },
      { emoji: '☕', cost: 6.50,  sing: 'oat latte',        plur: 'oat lattes' },
      { emoji: '🎮', cost: 9.99,  sing: 'month of Game Pass', plur: 'months of Game Pass' },
      { emoji: '🍜', cost: 16.00, sing: 'ramen bowl',       plur: 'ramen bowls' },
      { emoji: '🧘', cost: 20.00, sing: 'yoga class',       plur: 'yoga classes' },
      { emoji: '📚', cost: 14.99, sing: 'paperback book',   plur: 'paperback books' },
      { emoji: '🌯', cost: 11.50, sing: 'Chipotle burrito', plur: 'Chipotle burritos' },
      { emoji: '🍦', cost: 5.50,  sing: 'ice cream cone',   plur: 'ice cream cones' },
    ],

    // Fun, guilt-tripping, or thoughtful nudges shown on the blocker card
    NUDGES: [
      p => `If you invest <strong>$${p.toFixed(0)}</strong> instead, future you gets a raise — every year, forever.`,
      p => `The dopamine from buying this lasts about <strong>15 minutes</strong>. The regret lasts until the credit card bill.`,
      p => `<strong>72% of online purchases</strong> are regretted within a week. Be the 28%.`,
      p => `Try the 24-hour rule: if you still want it tomorrow, it's not impulse — it's intention.`,
      p => `Screenshot it. Add it to a wishlist. If you forget about it, you never needed it.`,
      p => `Ask yourself: would you pick up <strong>$${p.toFixed(0)}</strong> off the ground? Then don't throw it away.`,
      p => `Plot twist: the best version of this is the one you buy after sleeping on it.`,
      p => `Your future self called. They said "thanks for not buying that."`,
      p => `Nothing in your cart loves you back.`,
      p => `Treat your bank account like a pet — don't starve it.`,
    ],

    // Default investment compound interest rate (10% annually)
    INVESTMENT_GROWTH_RATE: 0.10,

    // Projection intervals (years)
    INVESTMENT_YEARS: [1, 5, 10, 20, 30]
  };
})();
