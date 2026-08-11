DO $$
DECLARE
  t RECORD;
  d TIMESTAMP;
  i INT;
  px NUMERIC; o NUMERIC; h NUMERIC; l NUMERIC; c NUMERIC; v BIGINT;
  shock NUMERIC;
BEGIN
  PERFORM setseed(0.4242);
  FOR t IN
    SELECT * FROM (VALUES
      ('AAPL', 185.0::numeric, 0.014::numeric, 0.0007::numeric),
      ('MSFT', 370.0::numeric, 0.013::numeric, 0.0008::numeric),
      ('TCS', 3450.0::numeric, 0.010::numeric, 0.0004::numeric),
      ('INFY', 1480.0::numeric, 0.012::numeric, 0.0003::numeric),
      ('RELI', 2650.0::numeric, 0.013::numeric, 0.0005::numeric)
    ) AS x(tk, base, vol, dr)
  LOOP
    px := t.base * 0.8;
    d := (CURRENT_DATE - INTERVAL '430 days')::timestamp;
    i := 0;
    WHILE i < 300 LOOP
      d := d + INTERVAL '1 day';
      IF EXTRACT(ISODOW FROM d) > 5 THEN
        CONTINUE;
      END IF;
      shock := ((random() - 0.5) * 2)::numeric * t.vol + t.dr + 0.0028 * sin(i / 17.0)::numeric + 0.0015 * sin(i / 61.0)::numeric;
      o := round(px * (1 + ((random() - 0.5) * 0.004)::numeric), 2);
      c := round(px * (1 + shock), 2);
      h := round(greatest(o, c) * (1 + (random() * 0.007)::numeric), 2);
      l := round(least(o, c) * (1 - (random() * 0.007)::numeric), 2);
      v := (3000000 * (0.6 + random() * 1.2) * (1 + abs(shock)::double precision * 12))::bigint;
      px := c;
      INSERT INTO public.stock_prices (ticker, price_date, open, high, low, close, volume)
      VALUES (t.tk, d::date, o, h, l, c, v)
      ON CONFLICT (ticker, price_date) DO NOTHING;
      i := i + 1;
    END LOOP;
  END LOOP;
END $$;