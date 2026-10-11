const image = (id, width = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
export const MENU_EXAMPLE_IMAGES = {
  cafe: image('photo-1501339847302-ac426a4a7cbb', 900),
  croissant: image('photo-1555507036-ab1f4038808a'),
  coffee: image('photo-1514432324607-a09d9b4aefdd'),
  latte: image('photo-1495474472287-4d71bcdd2085'),
  burger: image('photo-1568901346375-23c9450c58cd'),
  burger2: image('photo-1550547660-d9450f859349'),
  fries: image('photo-1573080496219-bb080dd4f877'),
  steak: image('photo-1546833999-b9f581a1996d'),
  steakFrites: image('photo-1600891964092-4316c288032e'),
  sliced: image('photo-1558030006-450675393462'),
  salad: image('photo-1512621776951-a57141f2eefd'),
  pizza: image('photo-1574071318508-1cdbab80d002'),
  pizza2: image('photo-1565299624946-b28f40a0ae38'),
  pizza3: image('photo-1513104890138-7c749659a591'),
  penne: image('photo-1621996346565-e3dbc646d9a9'),
  prawnPasta: image('photo-1563379926898-05f4575a45d8'),
  sushi: image('photo-1579871494447-9811cf80d66c'),
  sushiPlatter: image('photo-1611143669185-af224c5e3252'),
  ramen: image('photo-1569718212165-3a8278d5f624'),
  noodles: image('photo-1585032226651-759b368d7246'),
  curry: image('photo-1585937421612-70a008356fbe'),
  butterChicken: image('photo-1565557623262-b51c2513a641'),
  paneer: image('photo-1588166524941-3bf61a9c41db'),
  prawnCurry: image('photo-1559847844-5315695dadae'),
  tacos: image('photo-1565299585323-38d6b0865b47'),
  tacos2: image('photo-1551504734-5ee1c4a1479b'),
  bowl: image('photo-1546069901-ba9599a7e63c'),
  grainBowl: image('photo-1512058564366-18510be2db19'),
  salmon: image('photo-1519708227418-c8fd9a32b7a2'),
  seafood: image('photo-1615141982883-c7ad0e69fd62'),
  donuts: image('photo-1551024601-bec78aea704b'),
  iceCream: image('photo-1497034825429-c343d7c6a68f'),
  sundae: image('photo-1563805042-7684c019e1cb'),
  pancakes: image('photo-1567620905732-2d1ec7ab7445'),
  eggToast: image('photo-1525351484163-7529414344d8'),
  oldFashioned: image('photo-1514362545857-3bc16c4c7d1b'),
  mojito: image('photo-1551538827-9c037cb4f32a'),
};

// [name, category, description, price, photo key, tags?]
const SAMPLES = {
  cafe: { name: 'Bakery & Bloom Café', tagline: 'Coffee, comfort & something sweet.', title: 'A little daily joy.', cover: 'cafe', rows: [['Butter croissant', 'Bakery', 'Golden layers, baked fresh each morning.', 3.25, 'croissant', ['popular']], ['Chocolate muffin', 'Bakery', 'Soft, rich and filled with chocolate.', 3.5, 'croissant'], ['Cinnamon roll', 'Bakery', 'Cinnamon warmth with a light vanilla glaze.', 4, 'croissant'], ['Almond croissant', 'Bakery', 'Our flaky classic with toasted almonds.', 4.25, 'croissant'], ['Flat white', 'Coffee', 'Rich espresso and silky steamed milk.', 4.5, 'coffee']] },
  restaurant: { name: 'The Golden Table', tagline: 'Good food. Beautiful evenings.', title: 'The dinner menu', rows: [['Garden salad', 'Starters', 'Seasonal greens, citrus and a herb dressing.', 7.5, 'salad', ['vegetarian']], ['Chef’s small plate', 'Starters', 'Fresh ingredients, thoughtfully prepared.', 9.5, 'salad'], ['Chargrilled steak', 'Main courses', 'Grilled to order, served with seasonal vegetables.', 24, 'steak'], ['House signature', 'Main courses', 'A generous plate from our seasonal kitchen.', 18.5, 'steak']] },
  burger: { name: 'Burger Club', tagline: 'Fresh off the grill. Made for you.', title: 'Made to crave.', rows: [['Classic beef burger', 'Burgers', 'Beef patty, cheddar, lettuce and house sauce.', 8.5, 'burger', ['popular']], ['Double cheeseburger', 'Burgers', 'Two patties, melted cheese and pickles.', 10.5, 'burger2'], ['Garden burger', 'Burgers', 'A crispy veggie patty with fresh greens.', 9, 'burger', ['vegetarian']], ['Seasoned fries', 'Sides', 'Golden fries with our signature seasoning.', 3.5, 'fries'], ['Loaded fries', 'Sides', 'Cheese sauce, herbs and a little heat.', 5.5, 'fries', ['spicy']]] },
  italian: { name: 'Trattoria Rosso', tagline: 'Pasta made by hand, every morning.', title: 'Il nostro menù', rows: [['Margherita', 'Pizze', 'San Marzano tomato, fior di latte and basil.', 11, 'pizza', ['vegetarian']], ['Diavola', 'Pizze', 'Spicy salami, chilli oil and mozzarella.', 13, 'pizza3', ['spicy']], ['Penne all’arrabbiata', 'Pasta', 'Garlic, chilli and slow-cooked tomato.', 12, 'penne', ['vegan']], ['Linguine ai gamberi', 'Pasta', 'Prawns, cherry tomatoes, lemon and parsley.', 17, 'prawnPasta', ['popular']]] },
  pizza: { name: 'Slice Pizzeria', tagline: 'Wood-fired. Hand-stretched. Shared.', title: 'Pizza menu', rows: [['Margherita', 'Classics', 'Tomato, mozzarella and fresh basil.', 10, 'pizza', ['vegetarian']], ['Pepperoni', 'Classics', 'Crispy pepperoni and a double layer of cheese.', 12, 'pizza3', ['popular']], ['Garden supreme', 'Classics', 'Peppers, onion, olives and mushrooms.', 12, 'pizza2'], ['Spicy nduja', 'Specials', 'Calabrian nduja, honey and chilli.', 14, 'pizza3', ['spicy', 'new']], ['Garlic knots', 'Sides', 'Brushed with garlic butter and parmesan.', 5, 'fries']] },
  sushi: { name: 'Sakura Sushi', tagline: 'Fresh fish. Quiet craft.', title: 'Menu', rows: [['Salmon maki', 'Rolls', 'Six pieces of salmon, rice and nori.', 8, 'sushi', ['popular']], ['Dragon roll', 'Rolls', 'Prawn tempura, avocado and eel sauce.', 13, 'sushiPlatter'], ['Omakase platter', 'Platters', 'Chef’s selection of nigiri and rolls.', 32, 'sushiPlatter', ['new']], ['Tonkotsu ramen', 'Hot bowls', 'Rich pork broth, egg and spring onion.', 15, 'ramen']] },
  curry: { name: 'Spice Route', tagline: 'Recipes carried across the Indian Ocean.', title: 'Curries & classics', rows: [['Butter chicken', 'Curries', 'Tandoori chicken in a silky tomato gravy.', 1450, 'butterChicken', ['popular']], ['Paneer makhani', 'Curries', 'Cottage cheese, cashew and fenugreek.', 1250, 'paneer', ['vegetarian']], ['Jaffna prawn curry', 'Curries', 'Roasted spices, coconut milk and tamarind.', 1950, 'prawnCurry', ['spicy']], ['Thali for two', 'To share', 'Three curries, dhal, rice and pickles.', 3200, 'curry']] },
  coffee: { name: 'Chalkboard Café', tagline: 'Small batch coffee, big conversations.', title: 'On the board', rows: [['Flat white', 'Coffee', 'Double ristretto, velvet milk.', 4.2, 'latte'], ['Cold brew', 'Coffee', 'Steeped for 18 hours.', 4.5, 'coffee', ['new']], ['Chai latte', 'Not coffee', 'Spiced black tea and steamed milk.', 4, 'latte', ['spicy']], ['Almond croissant', 'Bakes', 'Twice baked with frangipane.', 3.8, 'croissant', ['popular']], ['Banana bread', 'Bakes', 'Toasted, with salted butter.', 3.5, 'croissant']] },
  tacos: { name: 'Taquería Sol', tagline: 'Street tacos with sunshine.', title: 'Tacos y más', rows: [['Al pastor', 'Tacos', 'Marinated pork, pineapple and coriander.', 4, 'tacos', ['popular']], ['Baja fish', 'Tacos', 'Crispy fish, lime slaw and chipotle mayo.', 4.5, 'tacos2'], ['Mushroom & poblano', 'Tacos', 'Charred mushrooms, roasted chilli and queso.', 4, 'tacos', ['vegetarian']], ['Loaded nachos', 'To share', 'Beans, pico de gallo and jalapeños.', 9, 'fries', ['spicy']]] },
  healthy: { name: 'Green Bowl', tagline: 'Fresh, colourful and full of goodness.', title: 'Bowls & greens', rows: [['Salmon poke', 'Bowls', 'Salmon, edamame, avocado and brown rice.', 13, 'bowl', ['popular']], ['Harvest grain bowl', 'Bowls', 'Quinoa, roast squash, kale and tahini.', 11, 'grainBowl', ['vegan', 'gluten-free']], ['Green goddess salad', 'Salads', 'Crunchy greens and herby yoghurt dressing.', 10, 'salad', ['vegetarian']], ['Avocado toast', 'Toasts', 'Sourdough, chilli flakes and a soft egg.', 9, 'eggToast']] },
  seafood: { name: 'Harbour Seafood', tagline: 'Today’s catch, simply cooked.', title: 'From the sea', rows: [['Seared salmon', 'Mains', 'Crispy skin, greens and lemon butter.', 24, 'salmon', ['popular']], ['Seafood platter', 'To share', 'Oysters, prawns, crab and mussels.', 58, 'seafood'], ['Prawn linguine', 'Mains', 'Garlic, chilli and white wine.', 21, 'prawnPasta'], ['Coconut prawn curry', 'Mains', 'Lemongrass, lime leaf and jasmine rice.', 19, 'prawnCurry', ['spicy']]] },
  steak: { name: 'Smoke & Ember', tagline: 'Dry-aged beef over open flame.', title: 'The grill', rows: [['Ribeye 300g', 'Steaks', 'Dry-aged 35 days, bone marrow butter.', 38, 'sliced', ['popular']], ['Steak frites', 'Steaks', 'Hanger steak, béarnaise and fries.', 26, 'steakFrites'], ['Beef fillet 220g', 'Steaks', 'Tender centre cut with red wine jus.', 42, 'steak'], ['Ember fries', 'Sides', 'Beef-dripping fries and smoked salt.', 6, 'fries']] },
  dessert: { name: 'Sweet Scoop', tagline: 'Ice cream, donuts and happy endings.', title: 'Sweet treats', rows: [['Strawberry swirl', 'Ice cream', 'Two scoops in a waffle cone.', 5, 'iceCream', ['popular']], ['Cookies & cream sundae', 'Ice cream', 'Hot fudge, crushed cookies and cream.', 7.5, 'sundae'], ['Sprinkle donuts', 'Bakes', 'Glazed and topped with rainbow sprinkles.', 3, 'donuts', ['new']], ['Stack of pancakes', 'Bakes', 'Maple syrup and whipped butter.', 8, 'pancakes']] },
  finedining: { name: 'Maison', tagline: 'Seasonal. Seven courses. One evening.', title: 'Menu dégustation', noPhotos: true, rows: [['Oyster, cucumber, dill', 'Amuse-bouche', 'Pickled cucumber and dill oil.', 8, null], ['Scallop, cauliflower, hazelnut', 'Entrée', 'Brown butter and golden raisins.', 24, null], ['Duck, cherry, beetroot', 'Plat principal', 'Aged duck breast, cherry jus.', 42, null], ['Chocolate, olive oil, sea salt', 'Dessert', 'Dark chocolate ganache and crumble.', 16, null]] },
  noodles: { name: 'Wok Street', tagline: 'Fire, noodles and late-night cravings.', title: 'Hot from the wok', rows: [['Chilli garlic noodles', 'Noodles', 'Hand-pulled noodles in fiery chilli oil.', 9, 'noodles', ['spicy', 'popular']], ['Tonkotsu ramen', 'Noodles', 'Pork broth, chashu and soft egg.', 12, 'ramen'], ['Prawn fried rice', 'Rice', 'Wok-tossed jasmine rice, egg and scallion.', 10, 'prawnPasta'], ['Salmon rice bowl', 'Rice', 'Teriyaki salmon over sticky rice.', 13, 'bowl', ['new']]] },
  brunch: { name: 'Sunny Side', tagline: 'Brunch every day until 3.', title: 'All-day brunch', rows: [['Buttermilk pancakes', 'Sweet', 'Berries, maple and whipped butter.', 11, 'pancakes', ['popular']], ['Sprinkle donuts', 'Sweet', 'Glazed fresh every morning.', 4, 'donuts'], ['Eggs on toast', 'Savoury', 'Sourdough, fried egg and chilli oil.', 10, 'eggToast', ['vegetarian']], ['Flat white', 'Drinks', 'House blend espresso.', 4, 'latte']] },
  cocktails: { name: 'Copper Lounge', tagline: 'Classic cocktails, modern twists.', title: 'Cocktails', rows: [['Old fashioned', 'Stirred', 'Bourbon, demerara and orange bitters.', 14, 'oldFashioned', ['popular']], ['Negroni', 'Stirred', 'Gin, Campari and sweet vermouth.', 13, 'oldFashioned'], ['Mojito', 'Shaken', 'Rum, lime, mint and soda.', 12, 'mojito'], ['Spicy margarita', 'Shaken', 'Tequila, lime and jalapeño.', 13, 'mojito', ['spicy']], ['Garden spritz', 'Low & no', 'Alcohol-free aperitivo and soda.', 8, 'mojito', ['new']]] },
};

export function menuExample(template) {
  const sample = SAMPLES[template.sample] || SAMPLES.cafe;
  const currency = template.sample === 'curry' ? 'LKR' : 'USD';
  return {
    id: 'template-preview', name: sample.name, tagline: sample.tagline, currency,
    coverImage: sample.cover ? MENU_EXAMPLE_IMAGES[sample.cover] : '',
    menuDesign: { template: template.id, title: sample.title, showSearch: false, priceStyle: 'number' },
    menu: sample.rows.map(([name, category, description, price, photo, tags = []], i) => ({ id: String(i), name, category, description, price, image: photo ? MENU_EXAMPLE_IMAGES[photo] : '', tags, available: true })),
  };
}
