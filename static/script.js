// ⚙️ Change this to wherever your FastAPI server runs
const API_URL = "";

const $ = id => document.getElementById(id);
const MAX_SCORE = 10; // adjust if your model's scores use a different scale

const countries = ["India","USA","Canada","Australia","UK","Germany","Mexico","Turkey","France","Other"];
$("countries").innerHTML = countries.map(c => `<option value="${c}">`).join("");

const platforms = ["Instagram","TikTok","YouTube","Facebook","Snapchat","Twitter","LinkedIn","WhatsApp","WeChat","LINE","KakaoTalk","VKontakte"];
$("most_used_platform").innerHTML = platforms.map(p => `<option>${p}</option>`).join("");

document.querySelector(".seg").innerHTML = ["Low","Medium","High","Very High"].map((s,i) =>
  `<input type="radio" name="stress" id="s${i}" value="${s}" ${s==="Medium"?"checked":""}><label for="s${i}">${s}</label>`).join("");

// live slider values
document.querySelectorAll(".range").forEach(r => {
  const i = r.querySelector("input"), o = r.querySelector("output");
  const upd = () => o.textContent = i.value + " h";
  i.addEventListener("input", upd); upd();
});

// gauge
const arc = $("arc"), LEN = arc.getTotalLength();
arc.style.strokeDasharray = LEN; arc.style.strokeDashoffset = LEN;

function show(score){
  const pct = Math.max(0, Math.min(1, score / MAX_SCORE));
  const color = pct >= .7 ? "var(--good)" : pct >= .5 ? "var(--mid)" : "var(--bad)";
  arc.style.stroke = color;
  arc.style.strokeDashoffset = LEN * (1 - pct);
  $("val").textContent = score.toFixed(2);
  const [v, n] = pct >= .7 ? ["Healthy range", "Habits here line up with better well-being scores."]
    : pct >= .5 ? ["Moderate", "Some habits may be worth adjusting, such as sleep or screen time."]
    : ["Needs attention", "This profile maps to lower scores. Sleep, activity and screen time are good places to start."];
  $("verdict").textContent = v; $("note").textContent = n;
}

$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("err"), btn = $("btn");
  err.hidden = true;
  const num = id => parseFloat($(id).value);
  const payload = {
    age: parseInt($("age").value),
    gender: $("gender").value,
    country: $("country").value.trim(),
    academic_level: $("academic_level").value,
    most_used_platform: $("most_used_platform").value,
    purpose_of_use: $("purpose_of_use").value,
    avg_daily_usage_hours: num("avg_daily_usage_hours"),
    daily_unlocks: parseInt($("daily_unlocks").value),
    study_hours: num("study_hours"),
    physical_activity_hours: num("physical_activity_hours"),
    sleep_hours_per_night: num("sleep_hours_per_night"),
    stress_level: document.querySelector("input[name=stress]:checked").value
  };
  if (!payload.country || isNaN(payload.age) || isNaN(payload.daily_unlocks)) {
    err.textContent = "Fill in age, country and phone unlocks."; err.hidden = false; return;
  }
  btn.disabled = true; btn.textContent = "Predicting…";
  try {
    const res = await fetch(API_URL + "/predict", {
      method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(res.status === 422 ? "The server rejected one of the values. Check the ranges." : "Server error " + res.status);
    const data = await res.json();
    show(data.predicted_mental_health_score);
  } catch (ex) {
    err.textContent = ex instanceof TypeError
      ? "Can't reach the API at " + API_URL + ". Is uvicorn running?"
      : ex.message;
    err.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = "Predict score";
  }
});
