## 检索短视频：

wget https://storage.googleapis.com/generativeai-downloads/images/GreatRedSpot.mp4



## 使用 File API 上传视频并输出 URI。


from google import genai

client = genai.Client(api_key="GEMINI_API_KEY")

print("Uploading file...")
video_file = client.files.upload(file="GreatRedSpot.mp4")
print(f"Completed upload: {video_file.uri}")



## 验证文件上传情况并检查状态

通过调用 files.get 方法，验证 API 是否已成功接收文件。

注意： 视频文件在 File API 中有一个 State 字段。视频上传后，将处于 PROCESSING 状态，直至准备就绪为止。只有 ACTIVE 文件可用于模型推理。

import time

# Check whether the file is ready to be used.
while video_file.state.name == "PROCESSING":
    print('.', end='')
    time.sleep(1)
    video_file = client.files.get(name=video_file.name)

if video_file.state.name == "FAILED":
  raise ValueError(video_file.state.name)

print('Done')


## 包含视频和文字的提示
上传的视频处于 ACTIVE 状态后，您可以发出 GenerateContent 请求来指定该视频的 File API URI。选择生成式模型，并为其提供上传的视频和文本提示。


from IPython.display import Markdown

# Pass the video file reference like any other media part.
response = client.models.generate_content(
    model="gemini-1.5-pro",
    contents=[
        video_file,
        "Summarize this video. Then create a quiz with answer key "
        "based on the information in the video."])

# Print the response, rendering any Markdown
Markdown(response.text)