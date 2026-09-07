import React, { useState } from "react";
import "../styles.css"; // adjust path if necessary

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Please enter a valid email and a password of at least 6 characters.");
      return;
    }
    // TODO: call your auth API here
    console.log("submit", { email, password });
    // optionally redirect on success
  }

  return (
    <div className="login-screen">
      <div className="card login-card">
        <h2 style={{marginTop:0}}>Welcome back</h2>
        <p className="muted">Sign in to continue to CampusConnect AI</p>

        <form onSubmit={handleSubmit} style={{marginTop:18}}>
          <div className="form-group">
            <label htmlFor="email" className="muted">Email</label>
            <input id="email" className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@school.edu" autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="muted">Password</label>
            <div style={{position:"relative"}}>
              <input id="password" type={show ? "text":"password"} className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={()=>setShow(s=>!s)} aria-label="Toggle password visibility"
                style={{
                  position:"absolute", right:8, top:8, background:"transparent", border:"none", cursor:"pointer", color:"#666"
                }}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button className="btn" type="submit">Sign in</button>
            <a href="/forgot" className="muted" style={{textDecoration:"none"}}>Forgot?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
