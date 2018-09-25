# waldo
udp broadcasting experiments

## 1) sending/watching udp broadcast packets locally

install socat ```sudo apt install socat```. 

listen for udp packets using tcpdump:

```tcpdump -l | grep UDP```

In a different terminal, start a broadcaster using:

```socat STDIO UDP4-DATAGRAM:255.255.255.255:6666,broadcast```

now start typing stuff in the broadcaster. 

now tcpdump receive packages from broadcast address/port 255.255.255.255:6666 .

Note that the broadcaster does not know about the client (does not know its IP address).

## 2) sending/watching udp broadcast packets with two separate computers

start tcpdump on computer A

start the broadcaster on computer B

If both computers are on the same wireless network, then A should receive UDP packets from B.

Update 9/25/18 from bennlich: cannot repro on either my PON public or private SSIDs. Also cannot ping other computers on the same network. Could be related to https://github.com/sudomesh/sudowrt-firmware/commit/0b8961d82ed8e721c40cb58c2c6f02d6eff6dcb9.

## 3) sending/watching udp broadcast packets with two separate computers connected to different mesh nodes

repeat above, only with computer A and B connected to separate meshing nodes.

(apply magic) (TODO: figure out what this magic needs to be)

Turns out that sudomesh router do *not* route udp broadcast packets to meshing nodes.

For example, if computer A sends a udp broadcast packet to 255.255.255.255:6666, the router interfaces open5 and br-open receive the udp package, but router interface mesh2 or mesh5 do not. The mesh2,5 interfaces are used for local meshing between nodes.

So, we need to change the xyz rules to enable forwarding to the mesh2 or mesh5 interfaces.

## 4) store UDP messages in an append-only log
Taken almost verbatim from socat man examples:
```
socat -u UDP4-LISTEN:6666,reuseaddr,fork OPEN:/tmp/waldo.log,creat,append
```
