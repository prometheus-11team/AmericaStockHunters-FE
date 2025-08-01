import yfinance as yf
from datetime import datetime, timedelta

start_date_test = "2023-01-01"
end_date_test = "2023-03-31"
ed_test = datetime.fromisoformat(end_date_test) + timedelta(days=1)

df_test = yf.download(
    "^IXIC",
    start=start_date_test,
    end=ed_test.strftime("%Y-%m-%d"),
    interval="1d",
    progress=False,
    auto_adjust=False
)
print(df_test.empty)
print(df_test.head())