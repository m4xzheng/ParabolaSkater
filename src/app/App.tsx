export default function App() {
  return (
    <main className="app-shell">
      <section className="stage">
        <p className="eyebrow">Parabola Skater</p>
        <h1>{'\u5173\u5361 1\uff1a\u611f\u53d7 a \u7684\u529b\u91cf'}</h1>
        <p className="description">
          {
            '\u8c03\u6574\u53c2\u6570\uff0c\u89c2\u5bdf\u629b\u7269\u7ebf\u7684\u53d8\u5316\uff0c\u51c6\u5907\u5f00\u59cb\u7b2c\u4e00\u5173\u3002'
          }
        </p>

        <form className="controls">
          <label htmlFor="parameter-a">{'\u53c2\u6570 a'}</label>
          <input
            id="parameter-a"
            name="a"
            type="range"
            min="-5"
            max="5"
            step="0.1"
            defaultValue="1"
          />
          <button type="button">Go</button>
        </form>
      </section>
    </main>
  );
}
