import Divider from "@/components/Divider";
import Button from "@/components/Button";
import Notice from "@/components/Notice";

export default function Home() {
  return (
    <>
      <div className="kicker">PROOF OF THOUGHT™</div>
      <h1 className="h1">Prove the idea is yours - seal it in 30 seconds.</h1>
      <p className="subhead">
        Create a permanent, cryptographically verifiable, time-stamped record showing that you possessed an original idea at a specific moment in time.
      </p>

      {/* Authority Seal */}
      <div style={{ marginBottom: 30, borderRadius: 6, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: 640, margin: "25px auto 30px auto" }}>
        <video
          src="/assets/Cryptographic_Custody_Protocol_Animation_Prompt_5.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", display: "block", filter: "brightness(1.1)" }}
        />
      </div>

      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          margin: "24px 0"
        }}
      />

      <Button href="/start" style={{ boxShadow: "0 0 15px rgba(66, 153, 225, 0.5)", borderColor: "#4299e1" }}>Get started</Button>
      <p className="small" style={{ marginTop: 18 }}>
        Not a patent filing. No lawyers required.
      </p>

      <Divider />

      <div className="twoCol">
        <div className="card">
          <div className="cardTitle">What this is</div>
          <ul className="list">
            <li>A formal certificate of conception &amp; possession</li>
            <li>A private custody vault that preserves your sealed ideas </li>
            <li>A cryptographic chain records your idea as it evolves over time</li>
            <li>Early traction for original human ideas, helping transform them into tradeable assets</li>
          </ul>
        </div>

        <div className="card">
          <div className="cardTitle">What this is not</div>
          <ul className="list">
            <li>Not a patent filing</li>
            <li>Not legal advice</li>
            <li>Not a government registry</li>
            <li>Not a disclosure or publication of your idea</li>
          </ul>
        </div>
      </div>

      <Divider />

      <div>
        <div className="kicker">How it works</div>
        <ol className="list">
          <li><b>Enter your idea.</b> Paste your original text.</li>
          <li><b>We time-seal and preserve it.</b> We compute a cryptographic fingerprint and record custody.</li>
          <li><b>Receive your certificate.</b> Download a formal PDF with a public verification link.</li>
          <li><b>Get traction.</b> Receive early market validation or valuation signals.</li>
        </ol>
      </div>

      <Divider />

      {/* Authority Seal */}
      <div className="heroSeal" style={{ margin: "30px 0", textAlign: "center" }}>
        <img
          src="/assets/proof_of_thought_timestamp_seal.png"
          alt="Proof of Thought Timestamp Seal"
          style={{ maxWidth: "100%", width: "150px", height: "auto" }}
        />
      </div>

      <div>
        <div className="kicker">Pricing</div>
        <ul className="list">
          <li><b>$29</b> — Single Certificate</li>
        </ul>
        <p className="small">
          Individual certificates are available today. Institutional, enterprise, and long-horizon custody tiers will be available shortly.
        </p>
      </div>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <a
          href="/assets/Proof_of_Thought_Genesis_White_Paper.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent)", fontSize: "0.9rem", textDecoration: "none" }}
        >
          Read the Founding White Paper &rarr;
        </a>
      </div>

      <div className="footer">
        <a href="/public-ledger">Public Ledger</a>
        <span>Verification Portal</span>
        <span>Terms</span>
        <span>Privacy</span>
        <a href="/contact">Contact</a>
      </div>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--muted)" }}>
        PROOF OF THOUGHT™ • Patent Pending
      </div>
    </>
  );
}
