const API = `/api/recipes-34151303`;

document.getElementById('recipe-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;

  const splitToArray = (t) =>
    (t || "")
      .split(/\n|,/)
      .map(s => s.replace(/^[-•\s]+/, "").trim())
      .filter(Boolean);

  const payload = {
    title: f.title.value.trim(),
    chef: f.chef.value.trim(),                // matches backend's "chef"
    mealType: f.mealType.value,
    cuisineType: f.cuisineType.value,
    prepTime: Number(f.prepTime.value),       // backend expects "prepTime"
    difficulty: f.difficulty.value,
    servings: Number(f.servings.value),
    ingredients: splitToArray(f.ingredients.value),
    instructions: splitToArray(f.instructions.value),
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      window.location.assign('/recipes'); // redirect to list page
    } else {
      alert('Failed: ' + await res.text());
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
});
