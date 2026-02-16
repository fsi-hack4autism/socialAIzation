# SocialAIzation
This repository is hosted as a part of FSI Hackathon for Autism (https://github.com/fsi-hack4autism)

## Description
Developing social relationships with peers can be one of the biggest challenges for individuals with autism, despite a strong desire to form them. Social programs can be hard to practice due to limited opportunities, which can lead to disappointing outcomes in the few interactions, resulting in stress and frustration. The Metaverse offers an opportunity to practice social interactions in a fully immersive environment and the ability to formulate successful programs which can replicated at scale. This use case will lay the groundwork for a social interaction in the Metaverse between a subject and an AI generated peer.

### Vocab
A.R. or Augmented Reality is when the user can see the physical world with virtual content overlayed on top of it. There are often subsets of AR talked about: Optical See-Through AR is where a person wears transparent glasses so their eyes directly pick up the physical world, and then either through transparent displays embedded in the glass or via projectors into the eye, digital content is displayed without blocking the view of the physical world. An example of this is the Microsoft HoloLens. Alternately there is Video See-Through AR which is where a person is given a VR headset that blocks their view of the physical world and then recreates it with cameras placed on the headset. This has become extremely popular recently with the Quest 2 and Pro, Pico 4, Vive XR Elite, Vive Pro line, and others. There are benefits and drawbacks to each approach.

V.R. or Virtual Reality is when the user is removed from the physical world and placed into an entirely virtual world.

M.R. or Mixed Reality has a long and mixed history of meanings, ranging from a catch all phrase (in research), to a specific type of AR where the physical world is scanned so that AR content interacts with the physical (Microsoft), to a synonym for Video See-Though AR (Meta). Because of this *mixed* history (see what I did there?) I will avoid using this term.

X.R. or Extended Reality is a more recent term used to describe either AR or VR and tends to be the most commonly used term among hardware manufacturers (Nvidia, Qualcomm) and in open source projects (WebXR, Metaverse Forum). 

Immersion vs Presence: this is a confusing one, but if you can distinguish between these, it helps a lot while designing. Immersion is typically considered an objective measure of how many senses or the quality of how well a sense is convinced by the virtual content. A more immersive experience is one with higher resolution VR displays, clear spatial audio, haptic feedback, free movement, etc. Presence is the subjective experience of the user in an experience - how much do they believe they're there? A book (low immersion) can have extremely high presence due to its gripping story that transports the user's imagination to a different world. Unfortunately a highly immersive VR game can have extremely low presence if the controls don't meet user expectations and the user doesn't feel engaged.

### Unity
[Unity](https://unity.com/download) is a game engine that can be used to create cross platform applications, including AR and VR headsets. While we will be emphasizing the use of Unity, if you have experience in Unreal or even Godot, you are more than welcome to use your engine of choice. We're emphasizing Unity because it has better built in platform support than the other engines, allowing you to develop applications for headsets, computers, and even web browsers. Additionally, it has the most up to date and extensive documentation system.

We recommend at least downloading Unity to your computers before the event - it is a large program and will take precious time to install. Unless there is a specific feature you're looking for, I recommend everyone download the latest version of **Unity 2021.3**. If you have time and think you may be doing development, here's some resources you may want to check out to get started:
- Unity has their own [Learning](https://learn.unity.com/?_gl=1%2Ah530y3%2A_gcl_aw%2AR0NMLjE2MzY3MTY5ODMuQ2p3S0NBaUF2cmlNQmhBdUVpd0E4Q3M1bGFJenM2UXZhV2RxendXU3cwSUlFN3ZYLXBrLTgySU50QWRTTk5acEl4dThCUGZPMnBFeTFSb0M5ZDhRQXZEX0J3RQ..%2A_gcl_dc%2AR0NMLjE2MzY3MTY5ODMuQ2p3S0NBaUF2cmlNQmhBdUVpd0E4Q3M1bGFJenM2UXZhV2RxendXU3cwSUlFN3ZYLXBrLTgySU50QWRTTk5acEl4dThCUGZPMnBFeTFSb0M5ZDhRQXZEX0J3RQ..&_ga=2.182193959.1225568882.1643885899-337911776.1601136010) resources that can take your from the basics all the way to AR projects. This is probably the first place you want to checkout
- YouTube is your friend when it comes to Unity - there are a ton of videos online of people teaching various tips and tricks.
	- For Unity basics and more game oriented tutorials, checkout [Brackeys - YouTube](https://www.youtube.com/@Brackeys)
	- For the latest AR/VR tutorials, checkout [Dilmer Valecillos - YouTube](https://www.youtube.com/@dilmerv)
- For those who anticipate wanting to create VR applications, look into [Unity's XR Interaction Toolkit](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@2.3/manual/index.html). Dilmer Valecillos has a [series of videos](https://www.youtube.com/watch?v=H6d-hagFFNc&list=PLQMQNmwN3Fvx2d7uNxMkVOs1aUV-vxrlf) on it.
- For those interested in AR or specifically in Microsoft's HoloLens, checkout [MRTK2](https://learn.microsoft.com/en-us/windows/mixed-reality/mrtk-unity/mrtk2/?view=mrtkunity-2022-05). Again, Dilmer has [videos](https://www.youtube.com/watch?v=wSPXTRYxq9A&list=PLQMQNmwN3FvzWQ1Hyb4XRnVncvCmcU8YY) on how to use.
- For those interested in VR with the Oculus/Meta Quest platform: [Get started developing Oculus VR Apps with Unity | Oculus Developers](https://developer.oculus.com/unity/). I will point out that this SDK does not work on all platforms (e.g. web), so I would not recommend using this tutorial if you want to support multiple platforms (I also wouldn't recommend trying to target multiple platforms in the short period of time we have for the hackathon).

Many of you will want to connect Unity to other web resources (Azure Text-To-Speech, OpenAI, etc). Unity provides their own web api the help with this. You can use C#'s built in functions, but Unity is not a threadsafe application, so if you aren't comfortable with thread wrangling, stick to Unity's API. Here are links to their documentation with examples of how to [GET](https://docs.unity3d.com/ScriptReference/Networking.UnityWebRequest.Get.html) and [POST](https://docs.unity3d.com/ScriptReference/Networking.UnityWebRequest.Post.html).

### Modeling and Animation
Given the social context, we anticipate many of you wanting to animate 3D avatars. There are a few ways to go about doing this. The traditional way is through hand animation and an Inverse Kinematic (IK) system. You can be very precise here and even have some programmed dynamism. Put simply, IK relies on a hidden skeleton in your 3D model with bones and joints. To animate a finger to point at something, rather than having to animate each joint, you only need to animate the finger tip and the IK system will guess at where all of the other bones and joints should go. Unity has it's own [IK System](https://docs.unity3d.com/Manual/InverseKinematics.html) with more on its [store](https://assetstore.unity.com/?q=IK&orderBy=1). Alternately, you can use a separate program like Blender or Maya to do the rigging and animation and export an FBX with that animation. Unity can then import the animated FBX and control when to play it. You may want to check out Unity [Animators](https://learn.unity.com/tutorial/controlling-animation) and Unity [Timeline](https://learn.unity.com/tutorial/timeline)

Alternatively, if there is extensive animation that you need to do, there are Motion Capture (Mocap) systems that you can use. This is the categority of technology used on things like the Avatar movies where you see people wearing suits with black or silvery dots on their face and body. Normally these tracking systems are extremely expensive, but recent advancements in AI and small depth cameras on phones have made lower quality versions of this very accessible.
- [MOVE Ai](https://www.move.ai/) allows you to use several phones placed around a room to record body movements. It doesn't work well for hands or faces, but will get the general movement of a person walking or looking in a particular direction.
- [Face Cap](https://apps.apple.com/us/app/face-cap-motion-capture/id1373155478) is an iOS application that can record a 3D animation of your face (if you have FaceID). It has the best quality facial animations I have found, but may or may not work well with the character you have modeled
- [Live Capture](https://docs.unity3d.com/Packages/com.unity.live-capture@1.0/manual/index.html#:~:text=Two%20Apps%20compatible%20with%20the%20Live%20Capture%20package,them%20on%20a%20character%20in%20your%20Unity%20Scene.) is a Unity specific application that does facial capture. It isn't as good as Face Cap, but is more likely to work with your avatars.

#### Rigging and Blendshapes
With animation comes the animation of bones and the animation of skin. Rigging/Bones help with large movements (walking, pointing, etc). Blendshapes/skin help with facial expressions and mouth movements. Unfortunately, there isn't a single standard for how to name the bones and blendshapes in 3D models, but rather several different methods that don't work together. Because of this, if you buy a rigged model online, you will often find that the rig doesn't match the rig you have animations for.

From Azure Text-to-Speech, you will be able to get [Viseme](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme?tabs=visemeid&pivots=programming-language-csharp) data. You can use this to translate mouth sounds into mouth movements. Done well, this can create a very convincing effect of having your avatar speak without needing to record a facial performance for every possible response to a person. If implemented this allows your application to adapt to user speech.

### Design Process
It can be very difficult to design for 3D when we don't have many good tools for 3D design. Even for those who are skilled at sketching 3D objects, the 2D nature of the page can limit how you think about and understand the 3D space. As a result, we encourage you to consider role-playing, rough 3D origami paper prototyping, and video prototypes as your main method of prototyping. We think this will give you a far better understanding of the experience you are designing for.

### Anticipated Roles
- Unity Development
- 3D Mesh Modeling and Texturing
- Lighting
- Rigging
- Mocap Acting
- Hand Animation
- Interaction and Experience Design
- Storyboard artists and video editors
- User Testing and Debugging
- Documentation

### Azure Resources
- OpenAI (ChatGPT)
- Speech-To-Text
- Text-To-Speech
	- Visemes
- App Service / Virtual Machine
- Nvidia Omniverse (maybe - fingers crossed)
