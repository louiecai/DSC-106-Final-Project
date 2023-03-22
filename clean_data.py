import pandas as pd

import os

if __name__ == "__main__":
    final_output = None
    for datafile in os.listdir("data"):
        if datafile == "final_output.csv":
            continue
        current = pd.read_csv("data/" + datafile).sample(frac=0.5)
        current["is_weekend"] = "weekend" in datafile
        current["city"] = datafile.split("_")[0]
        if final_output is None:
            final_output = current
            continue
        final_output = pd.concat([final_output, current])

    final_output.drop("Unnamed: 0", axis=1, inplace=True)
    final_output.to_csv("data/final_output.csv", index=False)
