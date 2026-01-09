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
      <div className="heroSeal">
        <img
          src="/assets/proof_of_thought_timestamp_seal.png"
          alt="Proof of Thought Timestamp Seal"
        />
      </div>

      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          margin: "24px 0"
        }}
      />

      <Button href="/start">Start a Certificate</Button>
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
          </ul>
        </div>

        <div className="card">
          <div className="cardTitle">What this is not</div>
          <ul className="list">
            <li>Not a patent filing</li>
            <li>Not legal advice</li>
            <li>Not a government registry</li>
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
        </ol>
      </div>

      <Divider />

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
        <span>Verification Portal</span>
        <span>Terms</span>
        <span>Privacy</span>
        <span>Contact</span>
      </div>
    </>
  );
}
