import { makeCoinIcon } from "../../utils/coinIcon";

export function CoinImage({ coin, large = false }) {
  return (
    <img
      className={large ? "coin-image large" : "coin-image"}
      src={coin.image || makeCoinIcon(coin.symbol)}
      alt={`${coin.name} logo`}
    />
  );
}
