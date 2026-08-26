#!/usr/bin/env python3

import torch


def main() -> None:
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU is not available inside the container")

    device = torch.device("cuda:0")
    probe = torch.empty(1, device=device)
    torch.cuda.synchronize(device)
    del probe
    free_bytes, total_bytes = torch.cuda.mem_get_info(device)
    print(
        f"CUDA ready: {torch.cuda.get_device_name(device)} "
        f"({total_bytes / 1024**3:.1f} GiB total, "
        f"{free_bytes / 1024**3:.1f} GiB free)",
        flush=True,
    )


if __name__ == "__main__":
    main()
