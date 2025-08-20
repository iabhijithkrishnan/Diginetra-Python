import sys
import platform

print("=== System Information ===")
print(f"OS: {platform.system()} {platform.release()}")
print(f"Python: {sys.version}")
print()

# Check PyTorch
print("=== PyTorch Information ===")
try:
    import torch
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"cuDNN version: {torch.backends.cudnn.version()}")
        print(f"Number of CUDA devices: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"  Device {i}: {torch.cuda.get_device_name(i)}")
            props = torch.cuda.get_device_properties(i)
            print(f"    Memory: {props.total_memory / 1024**3:.1f} GB")
            print(f"    Compute Capability: {props.major}.{props.minor}")
    else:
        print("No CUDA devices detected")
        
    # Check for MPS (Apple Silicon)
    if hasattr(torch.backends, 'mps'):
        print(f"MPS available: {torch.backends.mps.is_available()}")
    
except ImportError:
    print("PyTorch not installed")
except Exception as e:
    print(f"Error checking PyTorch: {e}")

print()

# Check OpenCV CUDA
print("=== OpenCV Information ===")
try:
    import cv2
    print(f"OpenCV version: {cv2.__version__}")
    
    # Check OpenCV build info
    build_info = cv2.getBuildInformation()
    
    # Look for CUDA in build info
    if "CUDA" in build_info:
        print("OpenCV compiled with CUDA support")
        try:
            cuda_devices = cv2.cuda.getCudaEnabledDeviceCount()
            print(f"OpenCV CUDA devices: {cuda_devices}")
        except:
            print("OpenCV CUDA functions not available")
    else:
        print("OpenCV compiled without CUDA support")
        
except ImportError:
    print("OpenCV not installed")
except Exception as e:
    print(f"Error checking OpenCV: {e}")

print()

# Check for NVIDIA GPU using nvidia-ml-py
print("=== NVIDIA GPU Information ===")
try:
    import pynvml
    pynvml.nvmlInit()
    device_count = pynvml.nvmlDeviceGetCount()
    print(f"NVIDIA GPUs detected: {device_count}")
    
    for i in range(device_count):
        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
        name = pynvml.nvmlDeviceGetName(handle).decode()
        memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
        print(f"  GPU {i}: {name}")
        print(f"    Total Memory: {memory.total / 1024**3:.1f} GB")
        print(f"    Free Memory: {memory.free / 1024**3:.1f} GB")
        print(f"    Used Memory: {memory.used / 1024**3:.1f} GB")
        
except ImportError:
    print("pynvml not installed (pip install nvidia-ml-py)")
    
    # Alternative check using nvidia-smi
    import subprocess
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            print(f"NVIDIA GPUs detected via nvidia-smi: {len(lines)}")
            for i, line in enumerate(lines):
                print(f"  GPU {i}: {line}")
        else:
            print("nvidia-smi not available or no NVIDIA GPUs detected")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("nvidia-smi command not found")
        
except Exception as e:
    print(f"Error checking NVIDIA GPUs: {e}")

print()

# Installation recommendations
print("=== Recommendations ===")
if torch.cuda.is_available():
    print("✅ GPU acceleration ready!")
else:
    print("❌ No GPU acceleration available")
    print("\nTo enable GPU acceleration:")
    print("1. Install/Update NVIDIA drivers")
    print("2. Install CUDA toolkit: https://developer.nvidia.com/cuda-downloads")
    print("3. Install GPU-enabled PyTorch:")
    print("   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118")
    print("4. Optionally install OpenCV with CUDA support")