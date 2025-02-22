/*
  # Recalculate monthly income requirements

  1. Changes
    - Updates min_income for all rooms to be monthly instead of annual
    - Preserves the same multiplier relationship with monthly rent
*/

-- Recalculate min_income to be monthly instead of annual
UPDATE rooms
SET min_income = price * (min_income::numeric / price / 12)
WHERE min_income > price * 5; -- Only update rooms where min_income appears to be annual
