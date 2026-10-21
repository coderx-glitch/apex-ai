MediaPipe Tasks Vision runtime and Hand Landmarker model are provided by Google/MediaPipe. Runtime package @mediapipe/tasks-vision,Apache-2.0.
Documentation:https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
Model download observed on the official hand-landmarker guide:
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
Package source:https://github.com/google-ai-edge/mediapipe
These assets perform local inference. APEX does not upload camera frames.

Face Landmarker model supports opt-in local experimental eye gestures. Model reference and behavior docs:
https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
Official model URL observed in Google sample:
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/tasks/face-landmarker.ts
SHA256 64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff
No face identity recognition,webcam recording or upload. Model inference alone does not establish human gesture accuracy. Reference-face QA uses the unannotated left half of Google's documentation example https://developers.google.com/static/mediapipe/images/solutions/examples/face_landmark.png,not shipped with APEX.
